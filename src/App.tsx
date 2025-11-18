// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore as firebaseFirestore } from './firebase/config'; // sem extensão

// largura da tela para carrossel
const { width: screenWidth } = Dimensions.get('window');

// Types para navegação
type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};
type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;
type MainTabParamList = {
  Map: undefined;
  Search: undefined;
  Profile: undefined;
};
type MapScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Map'>;
type SearchScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Search'>;
type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// --- HeritageSite type preservando nomes do Firestore ---
type HeritageSite = {
  id: string; // doc.id
  // campos exatamente como no Firestore (conforme sua lista)
  nm_patrimonio?: string;
  nm_autor_projeto?: string;
  imageUrls?: string[]; // espera array de URLs (Cloudinary / Storage)
  ic_inauguracao?: string;
  ds_fonte?: string;
  ds_funcionamento?: string;
  nu_longitude?: number | string; // no Firestore é float64, mas deixamos margem para string
  nu_latitude?: number | string;
  ic_tombamento?: string;
  ds_uso_original?: string;
  ds_uso_atual?: string;
  ds_localizacao?: string;
  ds_historico?: string;
  ds_endereco?: string;
  ds_grau?: string;
  ic_projeto?: string;

  // convenience fields (não substituem os originais; apenas para uso interno)
  latitude?: number;
  longitude?: number;
};

// ---------- AuthScreen (simples placeholder) ----------
const AuthScreen = ({ navigation }: { navigation: AuthScreenNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = () => {
    if (email && password) {
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Preencha e-mail e senha');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('./assets/patrimony.png')} style={styles.logo} accessibilityLabel="Logo" />
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isRegistering ? 'Cadastrar' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggleText}>{isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ---------- MapScreen (usa os nomes originais do Firestore) ----------
const MapScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [heritageSites, setHeritageSites] = useState<HeritageSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);

  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const SANTOS_LATITUDE = -23.9608;
  const SANTOS_LONGITUDE = -46.3331;

  // location
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!mounted) return;
        setErrorMsg('Permissão de localização negada — centrando mapa em Santos.');
        setLocation({
          coords: {
            latitude: SANTOS_LATITUDE,
            longitude: SANTOS_LONGITUDE,
            accuracy: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
            altitudeAccuracy: 0,
          },
          timestamp: Date.now(),
        } as Location.LocationObject);
        return;
      }
      try {
        const current = await Location.getCurrentPositionAsync({});
        if (!mounted) return;
        setLocation(current);
      } catch (e) {
        console.error('Erro posição:', e);
        if (!mounted) return;
        setErrorMsg('Não foi possível obter localização — centrando em Santos.');
        setLocation({
          coords: {
            latitude: SANTOS_LATITUDE,
            longitude: SANTOS_LONGITUDE,
            accuracy: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
            altitudeAccuracy: 0,
          },
          timestamp: Date.now(),
        } as Location.LocationObject);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // função utilitária: tenta extrair número válido de vários formatos
  const parseNumber = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return null;
      return v;
    }
    const parsed = parseFloat(String(v).replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  };

  // Firestore realtime: mapeia e preserva nomes originais do Firestore
  useEffect(() => {
    setSitesLoading(true);
    const colRef = collection(firebaseFirestore, 'patrimonios_santos');

    console.log('Iniciando onSnapshot patrimonios_santos...');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        console.log('Snapshot recebido, docs:', snapshot.size);
        const sites: HeritageSite[] = snapshot.docs.map((doc) => {
          const data: any = doc.data() || {};

          // preserva campos originais (usando os nomes reais)
          const nm_patrimonio = data.nm_patrimonio || '';
          const nm_autor_projeto = data.nm_autor_projeto || '';
          const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.images || data.fotos || []);
          const ic_inauguracao = data.ic_inauguracao || data.ic_inauguracao || '';
          const ds_fonte = data.ds_fonte || '';
          const ds_funcionamento = data.ds_funcionamento || '';
          const nu_longitude_raw = data.nu_longitude ?? data.longitude ?? data.lng ?? null;
          const nu_latitude_raw = data.nu_latitude ?? data.latitude ?? data.lat ?? null;
          const ic_tombamento = data.ic_tombamento || '';
          const ds_uso_original = data.ds_uso_original || '';
          const ds_uso_atual = data.ds_uso_atual || '';
          const ds_localizacao = data.ds_localizacao || '';
          const ds_historico = data.ds_historico || '';
          const ds_endereco = data.ds_endereco || '';
          const ds_grau = data.ds_grau || '';
          const ic_projeto = data.ic_projeto || '';

          // parse para números (pois você disse que são float64 no Firestore)
          const parsedLat = parseNumber(nu_latitude_raw);
          const parsedLng = parseNumber(nu_longitude_raw);

          if (parsedLat === null || parsedLng === null) {
            console.warn(`Documento ${doc.id} sem coords válidas. nu_latitude:${nu_latitude_raw} nu_longitude:${nu_longitude_raw}`);
          }

          const site: HeritageSite = {
            id: doc.id,
            nm_patrimonio,
            nm_autor_projeto,
            imageUrls,
            ic_inauguracao,
            ds_fonte,
            ds_funcionamento,
            nu_longitude: nu_longitude_raw,
            nu_latitude: nu_latitude_raw,
            ic_tombamento,
            ds_uso_original,
            ds_uso_atual,
            ds_localizacao,
            ds_historico,
            ds_endereco,
            ds_grau,
            ic_projeto,
            latitude: parsedLat ?? 0,   // convenience field (usado para markers)
            longitude: parsedLng ?? 0,  // convenience field
          };

          return site;
        });

        setHeritageSites(sites);
        setSitesLoading(false);
      },
      (err) => {
        console.error('Erro no snapshot do Firestore:', err);
        // fallback: tenta getDocs uma vez
        (async () => {
          try {
            const q = await getDocs(colRef);
            const sites: HeritageSite[] = q.docs.map((doc) => {
              const data: any = doc.data() || {};
              const nm_patrimonio = data.nm_patrimonio || '';
              const nm_autor_projeto = data.nm_autor_projeto || '';
              const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.images || data.fotos || []);
              const nu_longitude_raw = data.nu_longitude ?? data.longitude ?? data.lng ?? null;
              const nu_latitude_raw = data.nu_latitude ?? data.latitude ?? data.lat ?? null;
              const parsedLat = parseNumber(nu_latitude_raw);
              const parsedLng = parseNumber(nu_longitude_raw);
              return {
                id: doc.id,
                nm_patrimonio,
                nm_autor_projeto,
                imageUrls,
                nu_longitude: nu_longitude_raw,
                nu_latitude: nu_latitude_raw,
                latitude: parsedLat ?? 0,
                longitude: parsedLng ?? 0,
                ds_localizacao: data.ds_localizacao || '',
                ds_endereco: data.ds_endereco || '',
                ds_historico: data.ds_historico || '',
                ds_grau: data.ds_grau || '',
                ds_funcionamento: data.ds_funcionamento || '',
                ic_inauguracao: data.ic_inauguracao || '',
                ds_fonte: data.ds_fonte || '',
                ic_tombamento: data.ic_tombamento || '',
                ds_uso_original: data.ds_uso_original || '',
                ds_uso_atual: data.ds_uso_atual || '',
                ic_projeto: data.ic_projeto || '',
              } as HeritageSite;
            });
            setHeritageSites(sites);
          } catch (e2) {
            console.error('Fallback getDocs também falhou:', e2);
          } finally {
            setSitesLoading(false);
          }
        })();
      }
    );

    return () => unsubscribe();
  }, []);

  // handlers
  const handleMarkerPress = (site: HeritageSite) => {
    setSelectedSite(site);
    setModalVisible(true);
    setCurrentImageIndex(0);
    if (scrollViewRef.current) scrollViewRef.current.scrollTo({ x: 0, animated: false });
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageWidth = screenWidth * 0.9;
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentImageIndex(index);
  };

  // render source aceita strings (urls) ou require locais
  const renderImageSource = (source: any) => {
    if (!source) return undefined;
    if (typeof source === 'string') return { uri: source };
    return source;
  };

  // texto de localização
  let text = 'Esperando a localização...';
  if (errorMsg) text = errorMsg;
  else if (location) text = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;

  return (
    <SafeAreaView style={styles.mapContainer}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation
          followsUserLocation
        >
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Sua Localização"
            description="Você está aqui!"
            pinColor="blue"
          />

          {heritageSites.map((site) => {
            // usa os campos originais nu_latitude/nu_longitude convertidos para numbers (convenience fields)
            if (!site || !Number.isFinite(site.latitude) || !Number.isFinite(site.longitude)) return null;
            return (
              <Marker
                key={site.id}
                coordinate={{ latitude: site.latitude!, longitude: site.longitude! }}
                title={site.nm_patrimonio || '(sem nome)'}
                description={site.ds_localizacao || site.ds_endereco || undefined}
                onPress={() => handleMarkerPress(site)}
                pinColor="red"
              />
            );
          })}
        </MapView>
      ) : (
        <View style={styles.loadingMapContainer}>
          <Text style={styles.mapSubtitle}>{text}</Text>
          {errorMsg ? null : <ActivityIndicator size="large" color="#D31570" />}
        </View>
      )}

      {/* painel debug temporário (remova em produção) */}
      <View style={{ position: 'absolute', top: 80, left: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 8, zIndex: 999 }}>
        <Text style={{ fontWeight: 'bold' }}>DEBUG Firestore</Text>
        <Text>Docs carregados: {heritageSites.length}</Text>
        {heritageSites.slice(0, 4).map((s, i) => (
          <View key={s.id || i} style={{ marginTop: 6 }}>
            <Text style={{ fontWeight: '600' }}>{i + 1}. {s.nm_patrimonio || '(sem nome)'}</Text>
            <Text style={{ fontSize: 12, color: '#333' }}>nu_latitude: {String(s.nu_latitude)} • nu_longitude: {String(s.nu_longitude)}</Text>
            <Text style={{ fontSize: 12, color: '#333' }}>latitude: {String(s.latitude)} • longitude: {String(s.longitude)}</Text>
          </View>
        ))}
      </View>

      {/* loading overlay */}
      {sitesLoading && (
        <View style={{ position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#8A2BE2" />
            <Text style={{ marginLeft: 8 }}>Carregando patrimônios...</Text>
          </View>
        </View>
      )}

      {/* Modal com detalhes mantendo campos originais */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedSite ? (
              <ScrollView contentContainerStyle={styles.modalScrollViewContent}>
                {/* Carrossel */}
                {selectedSite.imageUrls && selectedSite.imageUrls.length > 0 ? (
                  <View style={styles.imageCarouselContainer}>
                    <ScrollView
                      ref={(r) => (scrollViewRef.current = r)}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                      style={styles.imageCarouselScrollView}
                    >
                      {selectedSite.imageUrls.map((src, idx) => (
                        <Image key={idx} source={renderImageSource(src)} style={styles.modalImageModern} onError={(e) => console.log('Erro imagem:', e.nativeEvent?.error || e)} />
                      ))}
                    </ScrollView>

                    {selectedSite.imageUrls.length > 1 && (
                      <View style={styles.paginationDots}>
                        {selectedSite.imageUrls.map((_, i) => (
                          <Text key={i} style={i === currentImageIndex ? styles.activeDot : styles.dot}>●</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noImageText}>Imagem não disponível</Text>
                )}

                {/* Info (usando nomes do Firestore) */}
                <View style={styles.infoBlock}>
                  <Text style={styles.modalTitleModern}>{selectedSite.nm_patrimonio}</Text>
                  {selectedSite.ds_endereco ? <Text style={styles.modalAddress}>{selectedSite.ds_endereco}</Text> : null}
                </View>

                {selectedSite.ds_historico ? (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>SOBRE</Text>
                    <Text style={styles.sectionContent}>{selectedSite.ds_historico}</Text>
                  </View>
                ) : null}

                {/* outros detalhes mapeados por nomes originais */}
                <View style={styles.heritageDetailsContainer}>
                  <Text style={styles.sectionTitle}>MAIS DETALHES</Text>
                  {selectedSite.ds_localizacao && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Localização:</Text><Text style={styles.detailValue}>{selectedSite.ds_localizacao}</Text></View>)}
                  {selectedSite.nm_autor_projeto && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Autor:</Text><Text style={styles.detailValue}>{selectedSite.nm_autor_projeto}</Text></View>)}
                  {selectedSite.ic_inauguracao && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Inauguração:</Text><Text style={styles.detailValue}>{selectedSite.ic_inauguracao}</Text></View>)}
                  {selectedSite.ds_uso_original && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Uso Original:</Text><Text style={styles.detailValue}>{selectedSite.ds_uso_original}</Text></View>)}
                  {selectedSite.ds_uso_atual && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Uso Atual:</Text><Text style={styles.detailValue}>{selectedSite.ds_uso_atual}</Text></View>)}
                  {selectedSite.ds_funcionamento && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Funcionamento:</Text><Text style={styles.detailValue}>{selectedSite.ds_funcionamento}</Text></View>)}
                  {selectedSite.ds_fonte && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Fonte:</Text><Text style={styles.detailValue}>{selectedSite.ds_fonte}</Text></View>)}
                  {selectedSite.ds_grau && (<View style={styles.detailRow}><Text style={styles.detailLabel}>Grau:</Text><Text style={styles.detailValue}>{selectedSite.ds_grau}</Text></View>)}
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ---------- SearchScreen (mantive simples) ----------
const SearchScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState(['Santos, São Paulo, Brasil', 'Salvador, Bahia, Brasil', 'São Paulo, São Paulo, Brasil']);

  const ClearSearchIcon = ({ color }: { color: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6L18 18" />
    </Svg>
  );

  const handleSearch = () => {
    if (searchText && !recentSearches.includes(searchText)) setRecentSearches([searchText, ...recentSearches.slice(0, 4)]);
  };

  const clearRecentSearch = (itemToClear: string) => setRecentSearches(recentSearches.filter((it) => it !== itemToClear));

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.searchPageHeader}><Text style={styles.searchPageTitle}>Pesquisar</Text></View>
      <View style={styles.modernSearchInputContainer}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.modernSearchIcon}>
          <Circle cx="11" cy="11" r="8" /><Path d="M21 21L16.65 16.65" />
        </Svg>
        <TextInput style={styles.modernSearchInput} placeholder="Pesquisar" placeholderTextColor="#888" value={searchText} onChangeText={setSearchText} onSubmitEditing={handleSearch} returnKeyType="search" />
        {searchText.length > 0 && (<TouchableOpacity onPress={() => setSearchText('')} style={styles.modernClearSearchButton}><ClearSearchIcon color="#888" /></TouchableOpacity>)}
      </View>

      <ScrollView style={styles.recentSearchesContainer}>
        {recentSearches.length > 0 && (
          <>
            <Text style={styles.recentSearchesTitle}>PESQUISAS RECENTES</Text>
            {recentSearches.map((item, index) => (
              <View key={index} style={styles.recentSearchItem}>
                <TouchableOpacity onPress={() => setSearchText(item)} style={styles.recentSearchTextContainer}><Text style={styles.recentSearchText}>{item}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => clearRecentSearch(item)} style={styles.recentSearchClearButton}><ClearSearchIcon color="#888" /></TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- ProfileScreen ----------
const ProfileScreen = ({ navigation }: { navigation: ProfileScreenNavigationProp }) => {
  const handleLogout = () => navigation.navigate('Auth');

  return (
    <SafeAreaView style={styles.profileScreenContainer}>
      <View style={styles.profileHeaderBar}><Text style={styles.profileHeaderTitle}>Perfil</Text></View>
      <ScrollView contentContainerStyle={styles.profileContentContainer}>
        <View style={styles.profileHeader}>
          <Image source={require('./assets/perfil.jpg')} style={styles.profileImage} />
          <TouchableOpacity><Text style={styles.changeProfileImageText}>Mudar imagem de perfil</Text></TouchableOpacity>
        </View>

        <View style={styles.profileDetailsList}>
          <TouchableOpacity style={styles.profileDetailRow}><Text style={styles.profileDetailLabel}>Nome</Text><Text style={styles.profileDetailValue}>Inacio Silva</Text><Text style={styles.profileDetailArrow}>{'>'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.profileDetailRow}><Text style={styles.profileDetailLabel}>Username</Text><Text style={styles.profileDetailValue}>@inacio_luz</Text><Text style={styles.profileDetailArrow}>&gt;</Text></TouchableOpacity>
          <TouchableOpacity style={styles.profileDetailRow}><Text style={styles.profileDetailLabel}>Email</Text><Text style={styles.profileDetailValue}>inaciosilva@gmail.com</Text><Text style={styles.profileDetailArrow}>&gt;</Text></TouchableOpacity>
          <TouchableOpacity style={styles.profileDetailRow}><Text style={styles.profileDetailLabel}>Bio</Text><Text style={styles.profileDetailValue}>Turistando pela cidade de Santos!</Text><Text style={styles.profileDetailArrow}>&gt;</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.profileDetailRow, styles.lastProfileDetailRow]}><Text style={styles.profileDetailLabel}>Configurações</Text><Text style={styles.profileDetailArrow}>&gt;</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, styles.logoutButtonProfile]} onPress={handleLogout}><Text style={styles.buttonText}>Sair</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- MainTabs ----------
const MainTabs = () => {
  const MapIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21.75S4 14.5 4 10.5C4 6.35786 7.58172 3 12 3C16.4183 3 20 6.35786 20 10.5C20 14.5 12 21.75 12 21.75Z" />
      <Circle cx="12" cy="10.5" r="3" />
    </Svg>
  );

  const SearchIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" /><Path d="M21 21L16.65 16.65" />
    </Svg>
  );

  const ProfileIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
    </Svg>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#8A2BE2',
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 15 : 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 10,
        },
        tabBarIcon: ({ color }) => {
          if (route.name === 'Map') return <MapIcon color={color} />;
          if (route.name === 'Search') return <SearchIcon color={color} />;
          if (route.name === 'Profile') return <ProfileIcon color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// ---------- App ----------
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  noImageText: { width: '100%', textAlign: 'center', color: '#888', fontSize: 16, marginVertical: 20 },
  infoBlock: { width: '100%', marginTop: 10, marginBottom: 10, paddingHorizontal: 20 },
  logo: { width: 400, height: 200, marginBottom: 40 },
  input: { width: '80%', padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff', fontSize: 16 },
  button: { backgroundColor: '#D31570', width: '80%', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  toggleText: { marginTop: 20, color: '#D31570', fontSize: 16 },
  mapContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0f7fa' },
  loadingMapContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  mapSubtitle: { fontSize: 16, color: '#555', marginBottom: 10, textAlign: 'center' },
  map: { width: '100%', height: '100%' },
  screenContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  screenTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, marginTop: 20, color: '#333', textAlign: 'center' },
  screenSubtitle: { fontSize: 18, color: '#555', marginBottom: 15 },
  searchPageHeader: { width: '100%', backgroundColor: '#8A2BE2', paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  searchPageTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  modernSearchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFF4', borderRadius: 10, paddingVertical: Platform.OS === 'ios' ? 10 : 5, paddingHorizontal: 15, marginHorizontal: 20, marginTop: 20, marginBottom: 20 },
  modernSearchIcon: { marginRight: 10 },
  modernSearchInput: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 0 },
  modernClearSearchButton: { marginLeft: 10, padding: 5 },
  modernClearSearchText: { fontSize: 18, color: '#888' },
  recentSearchesContainer: { flex: 1, width: '100%', paddingHorizontal: 20 },
  recentSearchesTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, marginLeft: 5 },
  recentSearchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recentSearchTextContainer: { flex: 1 },
  recentSearchText: { fontSize: 16, color: '#333' },
  recentSearchClearButton: { padding: 5 },
  recentSearchClearIcon: { fontSize: 16, color: '#888' },
  profileScreenContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeaderBar: { width: '100%', backgroundColor: '#8A2BE2', paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  profileHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileContentContainer: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc', marginBottom: 10 },
  changeProfileImageText: { color: '#8A2BE2', fontSize: 16, fontWeight: 'bold' },
  profileDetailsList: { width: '100%', backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3 },
  profileDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  lastProfileDetailRow: { borderBottomWidth: 0 },
  profileDetailLabel: { fontSize: 16, color: '#555', flex: 1 },
  profileDetailValue: { fontSize: 16, color: '#333', fontWeight: 'bold', marginRight: 10 },
  profileDetailArrow: { fontSize: 18, color: '#888', fontWeight: 'bold' },
  logoutButtonProfile: { marginTop: 30, backgroundColor: '#dc3545' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 22, backgroundColor: 'rgb(255, 255, 255)' },
  modalView: { backgroundColor: 'white', borderRadius: 20, width: '90%', maxHeight: '90%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, paddingTop: 0, paddingHorizontal: 0, paddingBottom: 20 },
  modalScrollViewContent: { alignItems: 'center', paddingBottom: 20 },
  modalTitleModern: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5, textAlign: 'left', width: '100%', paddingHorizontal: 20 },
  modalAddress: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'left', width: '100%', paddingHorizontal: 20 },
  imageCarouselContainer: { width: '100%', height: 200, marginBottom: 0, borderRadius: 0, overflow: 'hidden' },
  imageCarouselScrollView: { width: '100%', height: '100%' },
  modalImageModern: { width: screenWidth * 0.9, height: '100%', resizeMode: 'cover', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, position: 'absolute', bottom: 5, width: '100%' },
  dot: { color: '#ccc', marginHorizontal: 5, fontSize: 18 },
  activeDot: { color: '#8A2BE2', marginHorizontal: 5, fontSize: 18 },
  sectionContainer: { width: '100%', marginTop: 15, marginBottom: 10, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5, textTransform: 'uppercase' },
  sectionContent: { fontSize: 16, color: '#333', lineHeight: 22, textAlign: 'justify' },
  appearsInRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  appearsInText: { fontSize: 16, color: '#333' },
  appearsInRating: { fontSize: 14, color: '#FFD700', fontWeight: 'bold' },
  heritageDetailsContainer: { width: '100%', marginTop: 20, backgroundColor: '#fff', borderRadius: 10, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3, paddingHorizontal: 20 },
  detailRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  detailLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', width: '35%' },
  detailValue: { fontSize: 14, color: '#555', flex: 1, textAlign: 'left' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 18 },
  buttonClose: { backgroundColor: '#A432C0', width: '80%', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalContent: { alignItems: 'center', paddingBottom: 20 },
  buttonContainer: { width: '100%', alignItems: 'center', marginTop: 15, paddingHorizontal: 20 },
});
