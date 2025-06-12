import React, { useState, useEffect, useRef } from 'react'; // Importado useRef para o ScrollView de imagens
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
  Dimensions, // Para obter a largura da tela para o carrossel de imagens
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg'; // Importa Svg e Path para ícones

// Obtém a largura da tela para o carrossel de imagens
const { width: screenWidth } = Dimensions.get('window');

// --- Definindo tipos para o React Navigation ---
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

// --- Componente da Tela de Autenticação (Login/Cadastro) ---
const AuthScreen = ({ navigation }: { navigation: AuthScreenNavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = () => {
    if (email && password) {
      console.log('E-mail:', email);
      console.log('Senha:', password);
      console.log(isRegistering ? 'Simulando Cadastro...' : 'Simulando Login...');
      navigation.navigate('MainTabs');
    } else {
      alert('Por favor, preencha o e-mail e a senha.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('./assets/patrimony.png')}
        style={styles.logo}
        accessibilityLabel="Logo do Aplicativo"
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleAuth}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? 'Cadastrar' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggleText}>
          {isRegistering
            ? 'Já tem uma conta? Faça login'
            : 'Não tem uma conta? Cadastre-se'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// --- Componente da Tela do Mapa com Localização do Usuário ---
const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollViewRef = useRef<ScrollView>(null); // Ref para o ScrollView do carrossel de imagens
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Estado para a imagem atual no carrossel

  // Coordenadas de Santos (Brasil)
  const SANTOS_LATITUDE = -23.9608;
  const SANTOS_LONGITUDE = -46.3331;

  // Defina o tipo para os patrimônios
  type HeritageSite = {
    id: string;
    name: string;
    shortDescription: string;
    address?: string;
    about?: string;
    appearsIn?: { text: string; rating?: number }[];
    location?: string;
    project?: string;
    author?: string;
    inauguration?: string;
    originalUse?: string;
    currentUse?: string;
    history?: string;
    tombamento?: string;
    grade?: string;
    operation?: string;
    source?: string;
    imageUrls?: any[];
    latitude: number;
    longitude: number;
  };
  
    // Patrimônios localizados em Santos
    const [heritageSites, setHeritageSites] = useState<HeritageSite[]>([
      {
        id: '1',
        name: 'Casa do Trem Bélico',
        shortDescription: 'Única edificação colonial-militar do gênero no país, com características da época de sua construção.',
        address: 'Rua Tiro Onze, 11 - Centro Histórico, Santos - SP, 11013-040', // Novo campo
        about: 'A Casa do Trem Bélico é a única edificação colonial-militar do gênero no país, com as características da época de sua construção. Foi armazém de equipamento bélico para a defesa da cidade. Tombada em 1937 e entregue ao IPHAN em 1965. Restaurada em 1977 pelo CONDEPRAAT, hoje funciona como um espaço cultural.', // Texto detalhado para 'SOBRE'
        appearsIn: [ // Novo campo para 'APARECE EM'
          { text: 'Tour no Centro de Santos', rating: 4.8 },
        ],
        location: 'Rua Tiro Onze, 11 - Centro Histórico, Santos - SP, 11013-040', // Mantido para detalhes
        project: 'Não especificado (Uso Original: Armazém de equipamento bélico)',
        author: 'José da Silva Pais',
        inauguration: '1734',
        originalUse: 'Armazém de equipamento bélico',
        currentUse: 'Espaço Cultural',
        history: 'Edificação colonial-militar do gênero, no país, com as características da construção desse tempo. Tombada em 1937 e entregue ao IPHAN em 1965. Restaurada em 1977 pelo CONDEPRAAT.',
        tombamento: '1937 (IPHAN)',
        grade: 'IPHAN',
        operation: 'Dias: Quarta-feira a sábado. Horário: 11h às 17h. Custo de ingresso: Gratuito. Acessibilidade: acessível.',
        source: 'ww.turismosantos.com.br',
        imageUrls: [
          require('./assets/Patrimonios/CASA DO TREM BÉLICO 01.jpg'),
          require('./assets/Patrimonios/CASA DO TREM BÉLICO 02.jpg'),
          require('./assets/Patrimonios/CASA DO TREM BÉLICO 03.jpg'),
        ],
        latitude: -23.9329357,
        longitude: -46.32324679999999,
      },
      {
        id: '2',
        name: 'Igreja Nossa Senhora do Rosário',
        shortDescription: 'Templo com origens na Irmandade de Nossa Senhora do Rosário dos Homens Pretos, que promovia a religiosidade católica entre a população negra.',
        address: 'Praça Ruy Barbosa, S/N Centro, Santos - SP, 11010-000', // Novo campo
        about: 'A Igreja Nossa Senhora do Rosário é um templo histórico com origens na Irmandade de Nossa Senhora do Rosário dos Homens Pretos, que promovia a religiosidade católica entre a população negra escravizada, sendo um marco importante na história da cidade.', // Texto detalhado para 'SOBRE'
        appearsIn: [ // Novo campo para 'APARECE EM'
          { text: 'Rota Religiosa de Santos', rating: 4.5 },
        ],
        location: 'Praça Ruy Barbosa, S/N Centro, Santos - SP, 11010-000', // Mantido para detalhes
        project: 'Capela',
        author: 'Marx Hell',
        inauguration: '1882',
        originalUse: 'Capela',
        currentUse: 'Igreja',
        history: 'Templo com origens na Irmandade de Nossa Senhora do Rosário dos Homens Pretos, que promovia a religiosidade católica entre a população negra escravizada.',
        tombamento: 'Não especificado na fonte',
        grade: 'N/A',
        operation: 'Dias: todos os dias exceto terça e sábado. Horário: 17h a 19h. Custo de ingresso: Gratuito. Acessibilidade: acessível.',
        source: 'roteirosbs.com.br, alxadasa.usp.br',
        imageUrls: [
          require('./assets/Patrimonios/IGREJA NOSSA SENHORA DO ROSÁRIO 01.jpg'),
          require('./assets/Patrimonios/IGREJA NOSSA SENHORA DO ROSÁRIO 02.jpg'),
        ],
        latitude: -23.9298,
        longitude: -46.3305,
      },
            {
        id: '3', // Certifique-se de que o ID é único
        name: 'BASÍLICA EMBARÉ',
        shortDescription: 'Igreja com projeto de E. Kemnitz, inaugurada em 1945 e utilizada como capela.',
        address: 'Av. Bartholom eu de Gusmão, 32 - Embaré, Santos - SP', // Adaptei o endereço
        about: 'A Basílica Embaré é um importante templo religioso em Santos, cujo projeto é de E. Kemnitz. Foi inaugurada em 1945 e, desde então, serve como um espaço de culto e fé para a comunidade.',
        appearsIn: [], // Adicione tours ou rotas se houver
        location: 'Av. Bartholom eu de Gusmão, 32 - Embaré, Santos - SP',
        project: 'Não especificado (Uso Original: Capela)',
        author: 'E. Kemnitz',
        inauguration: '1945',
        originalUse: 'Capela',
        currentUse: 'Basílica',
        history: 'Inaugurada em 1945, a Basílica Embaré é uma obra de E. Kemnitz, inicialmente concebida como capela.',
        tombamento: 'Não especificado na fonte',
        grade: 'Não especificado na fonte',
        operation: 'Dias: Segunda a Sábado. Horário: Segunda a Sábado. Custo de ingresso: Gratuito. Acessibilidade: acessível.', // Adaptei do que estava visível
        source: 'n/a',
        imageUrls: [
          require('./assets/Patrimonios/BASÍLICA EMBARÉ 01.jpg'),
          require('./assets/Patrimonios/BASÍLICA EMBARÉ 02.jpg'),
          require('./assets/Patrimonios/BASÍLICA EMBARÉ 03.jpg'),
        ], // Adicione require('./assets/Patrimonios/BASILICA_EMBARE_01.jpg') se tiver imagens
        latitude: -23.9743034, // POR FAVOR, SUBSTITUA PELA LATITUDE CORRETA DA BASÍLICA EMBARÉ
        longitude: -46.320091617, // POR FAVOR, SUBSTITUA PELA LONGITUDE CORRETA DA BASÍLICA EMBARÉ
      },
      {
        id: '4', // Certifique-se de que o ID é único
        name: 'CASA DA CÂMARA E CADEIA',
        shortDescription: 'Edifício de 1836, originalmente para administração pública municipal e uso educacional.',
        address: 'Pr. dos Andradas, S/N - Centro, Santos - SP',
        about: 'A Casa da Câmara e Cadeia é um edifício histórico de 1836, construído com pedra, cal, argila, areia e melado. Serviu inicialmente para administração pública municipal e também teve uso educacional. Atualmente, mantém sua relevância histórica e cultural.',
        appearsIn: [], // Adicione tours ou rotas se houver
        location: 'Pr. dos Andradas, S/N - Centro, Santos - SP',
        project: 'Não especificado',
        author: 'Desconhecido',
        inauguration: '1836',
        originalUse: 'Administração pública municipal',
        currentUse: 'Administração pública/Educacional (confirmar)', // Confirme o uso atual
        history: 'Construída em 1836 com materiais como pedra, cal, argila, areia e melado, o edifício teve um papel crucial na administração pública da cidade.',
        tombamento: 'Não especificado na fonte',
        grade: 'Não especificado na fonte',
        operation: 'Dias: Segunda a Sexta. Horário: 08:00 a 18:00. Custo de ingresso: Gratuito. Acessibilidade: acessível.', // Adaptei do que estava visível
        source: 'http://jornalperspectiva.com.br/santos-e-suas-historias/',
        imageUrls: [
          require('./assets/Patrimonios/CASA DA CÂMARA 01.jpg'),
          require('./assets/Patrimonios/CASA DA CÂMARA 02.jpg'),
          require('./assets/Patrimonios/CASA DA CÂMARA 03.jpg'),
        ], // Adicione require('./assets/Patrimonios/CASA_CAMARA_CADEIA_01.jpg') se tiver imagens
        latitude: -23.9366, // POR FAVOR, SUBSTITUA PELA LATITUDE CORRETA DA CASA DA CÂMARA E CADEIA
        longitude: -46.3292, // POR FAVOR, SUBSTITUA PELA LONGITUDE CORRETA DA CASA DA CÂMARA E CADEIA
      },
      {
        id: '5', // Certifique-se de que o ID é único
        name: 'DECK DO PESCADOR',
        shortDescription: 'Local de pesca e lazer inaugurado em 2003, projetado por Ricardo Cuttin e Carlos Prates.',
        address: 'Avenida Bartolomeu de Gusmão, em frente ao número 32 - Embaré, Santos - SP', // Adaptei o endereço
        about: 'O Deck do Pescador, inaugurado em 2003, é um projeto de Ricardo Cuttin e Carlos Prates. É um espaço destinado à pesca e ao lazer, oferecendo uma vista privilegiada da orla de Santos e sendo um ponto de encontro para moradores e turistas.',
        appearsIn: [], // Adicione tours ou rotas se houver
        location: 'Avenida Bartolomeu de Gusmão, em frente',
        project: 'Deck de Pesca',
        author: 'Ricardo Cuttin e Carlos Prates',
        inauguration: '2003',
        originalUse: 'Pesca',
        currentUse: 'Pesca',
        history: 'Projetado e inaugurado em 2003, o Deck do Pescador tornou-se um local popular para a prática da pesca amadora e para o lazer na orla santista.',
        tombamento: 'Não especificado na fonte',
        grade: 'Não especificado na fonte',
        operation: 'Dias: Todos os dias. Horário: Aberto. Custo de ingresso: Gratuito. Acessibilidade: acessível.', // Adaptei do que estava visível
        source: 'n/a',
        imageUrls: [
          require('./assets/Patrimonios/DECK DO PESCADOR 01.jpg'),
          require('./assets/Patrimonios/DECK DO PESCADOR 02.jpg'),
        ], 
        latitude: -23.9782, // POR FAVOR, SUBSTITUA PELA LATITUDE CORRETA DO DECK DO PESCADOR (pode ser a mesma da Basílica por ser "em frente")
        longitude: -46.3094, // POR FAVOR, SUBSTITUA PELA LONGITUDE CORRETA DO DECK DO PESCADOR
      },
      {
        id: '6', // Certifique-se de que o ID é único
        name: 'MUSEU DO CAFÉ',
        shortDescription: 'Museu de 1998, visa preservar e divulgar a história do café, com projeto de Roberto Cochrane Simonsen.',
        address: 'R. Quinze de Novembro, 95 - Centro, Santos - SP',
        about: 'O Museu do Café, inaugurado em 1998, é um projeto de Roberto Cochrane Simonsen. Sua missão é preservar e divulgar a história do café no Brasil e sua importância para o desenvolvimento do país, especialmente para a cidade de Santos. O museu funciona no antigo prédio da Bolsa Oficial de Café, um edifício histórico e de grande valor arquitetônico.',
        appearsIn: [], // Adicione tours ou rotas se houver
        location: 'R. Quinze de Novembro, 95 - Centro, Santos - SP',
        project: 'Museu',
        author: 'Roberto Cochrane Simonsen',
        inauguration: '1998',
        originalUse: 'Bolsa Oficial de Café (confirmar)', // Assumindo pelo contexto
        currentUse: 'Museu',
        history: 'Fundado em 1998, o Museu do Café foi estabelecido para contar a rica história do café, desde seu cultivo até a comercialização, e seu impacto na economia brasileira.',
        tombamento: 'Não especificado na fonte',
        grade: 'Não especificado na fonte',
        operation: 'Dias: Terça a Domingo. Horário: de terça a domingo. Custo de ingresso: pago (confirmar). Acessibilidade: acessível.', // Adaptei do que estava visível
        source: 'n/a',
        imageUrls: [
          require('./assets/Patrimonios/MUSEU DO CAFÉ 01.png'),
          require('./assets/Patrimonios/MUSEU DO CAFÉ 02.png'),
        ], // Adicione require('./assets/Patrimonios/MUSEU_CAFE_01.jpg') se tiver imagens
        latitude: -23.9351, // POR FAVOR, SUBSTITUA PELA LATITUDE CORRETA DO MUSEU DO CAFÉ
        longitude: -46.3262, // POR FAVOR, SUBSTITUA PELA LONGITUDE CORRETA DO MUSEU DO CAFÉ
      },
    ]);
    const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
    const [modalVisible, setModalVisible] = useState(false);


  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada. O mapa será centrado em Santos.');
        setLocation({ coords: { latitude: SANTOS_LATITUDE, longitude: SANTOS_LONGITUDE, accuracy: 0, altitude: 0, heading: 0, speed: 0, altitudeAccuracy: 0 }, timestamp: 0 });
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (e) {
        console.error("Erro ao obter localização atual:", e);
        setErrorMsg('Não foi possível obter sua localização atual. O mapa será centrado em Santos.');
        setLocation({ coords: { latitude: SANTOS_LATITUDE, longitude: SANTOS_LONGITUDE, accuracy: 0, altitude: 0, heading: 0, speed: 0, altitudeAccuracy: 0 }, timestamp: 0 });
      }
    })();
  }, []);

  interface HandleMarkerPressSite {
    id: string;
    name: string;
    shortDescription: string;
    address?: string;
    about?: string;
    appearsIn?: { text: string; rating?: number }[];
    location?: string;
    project?: string;
    author?: string;
    inauguration?: string;
    originalUse?: string;
    currentUse?: string;
    history?: string;
    tombamento?: string;
    grade?: string;
    operation?: string;
    source?: string;
    imageUrls?: any[];
    latitude: number;
    longitude: number;
  }

  const handleMarkerPress = (site: HandleMarkerPressSite): void => {
    setSelectedSite(site);
    setModalVisible(true);
    setCurrentImageIndex(0); // Reinicia o índice da imagem ao abrir o modal
  };

  interface ScrollEvent {
    nativeEvent: {
      contentOffset: {
        x: number;
        y: number;
      };
    };
  }

  const handleScroll = (event: ScrollEvent) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const imageWidth = screenWidth * 0.9 - (35 * 2); // Correct calculation for modalImage width
    const index = Math.round(contentOffsetX / imageWidth);
    setCurrentImageIndex(index);
  };

  let text = 'Esperando a localização...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
  }

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
          showsUserLocation={true}
          followsUserLocation={true}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title={"Sua Localização"}
            description={"Você está aqui!"}
            pinColor="blue"
          />
          {heritageSites.map((site) => (
            <Marker
              key={site.id}
              coordinate={{ latitude: site.latitude, longitude: site.longitude }}
              title={site.name}
              description={site.shortDescription} // Usando shortDescription para o marcador
              onPress={() => handleMarkerPress(site)}
              pinColor="red"
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingMapContainer}>
          <Text style={styles.mapSubtitle}>{text}</Text>
          {errorMsg ? null : <ActivityIndicator size="large" color="#D31570" />}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}> {/* Novo estilo para o card do modal */}
            {selectedSite && (
              <ScrollView contentContainerStyle={styles.modalScrollViewContent}> {/* ScrollView para todo o conteúdo do card */}
                {/* Carrossel de Imagens */}
                {selectedSite.imageUrls && selectedSite.imageUrls.length > 0 ? (
                  <View style={styles.imageCarouselContainer}>
                    <ScrollView
                      ref={scrollViewRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                      style={styles.imageCarouselScrollView}
                    >
                      {selectedSite.imageUrls.map((source, index) => (
                        <Image
                          key={index}
                          source={source}
                          style={styles.modalImageModern} // Novo estilo para a imagem dentro do carrossel
                          onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
                        />
                      ))}
                    </ScrollView>
                    {selectedSite.imageUrls.length > 1 && (
                      <View style={styles.paginationDots}>
                        {selectedSite.imageUrls.map((_, index) => (
                          <Text
                            key={index}
                            style={index === currentImageIndex ? styles.activeDot : styles.dot}
                          >
                            ●
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noImageText}>Imagem não disponível</Text>
                )}

                {/* Título e Endereço */}
                <View style={styles.infoBlock}>
                  <Text style={styles.modalTitleModern}>{selectedSite.name}</Text>
                  {selectedSite.address && (
                    <Text style={styles.modalAddress}>{selectedSite.address}</Text>
                  )}
                </View>

                {/* Seção SOBRE */}
                {selectedSite.about && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>SOBRE</Text>
                    <Text style={styles.sectionContent}>{selectedSite.about}</Text>
                  </View>
                )}

                {/* Seção APARECE EM */}
                {selectedSite.appearsIn && selectedSite.appearsIn.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>APARECE EM</Text>
                    {selectedSite.appearsIn.map((item, index) => (
                      <View key={index} style={styles.appearsInRow}>
                        <Text style={styles.appearsInText}>{item.text}</Text>
                        {item.rating && (
                          <Text style={styles.appearsInRating}>⭐ {item.rating}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Detalhes do Patrimônio (seção detalhada anterior) - Opcional, pode ser menos prominente */}
                <View style={styles.heritageDetailsContainer}>
                  <Text style={styles.sectionTitle}>MAIS DETALHES</Text>
                  {selectedSite.location && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Localização:</Text>
                      <Text style={styles.detailValue}>{selectedSite.location}</Text>
                    </View>
                  )}
                  {selectedSite.project && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Projeto:</Text>
                      <Text style={styles.detailValue}>{selectedSite.project}</Text>
                    </View>
                  )}
                  {selectedSite.author && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Autor do Projeto:</Text>
                      <Text style={styles.detailValue}>{selectedSite.author}</Text>
                    </View>
                  )}
                  {selectedSite.inauguration && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Inauguração:</Text>
                      <Text style={styles.detailValue}>{selectedSite.inauguration}</Text>
                    </View>
                  )}
                  {selectedSite.originalUse && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Uso Original:</Text>
                      <Text style={styles.detailValue}>{selectedSite.originalUse}</Text>
                    </View>
                  )}
                  {selectedSite.currentUse && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Uso Atual:</Text>
                      <Text style={styles.detailValue}>{selectedSite.currentUse}</Text>
                    </View>
                  )}
                  {selectedSite.history && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Histórico:</Text>
                      <Text style={styles.detailValue}>{selectedSite.history}</Text>
                    </View>
                  )}
                  {selectedSite.tombamento && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tombamento:</Text>
                      <Text style={styles.detailValue}>{selectedSite.tombamento}</Text>
                    </View>
                  )}
                  {selectedSite.grade && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Grau:</Text>
                      <Text style={styles.detailValue}>{selectedSite.grade}</Text>
                    </View>
                  )}
                  {selectedSite.operation && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Funcionamento:</Text>
                      <Text style={styles.detailValue}>{selectedSite.operation}</Text>
                    </View>
                  )}
                  {selectedSite.source && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fonte:</Text>
                      <Text style={styles.detailValue}>{selectedSite.source}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
       )}
            {/* Novo container para o botão de fechar */}
            <View style={styles.buttonContainer}> {/* Adicione esta View */}
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Fechar</Text>
              </TouchableOpacity>
            </View> {/* Feche esta View */}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Componente da Tela de Pesquisa de Patrimônios ---
const SearchScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'Santos, São Paulo, Brasil',
    'Salvador, Bahia, Brasil',
    'São Paulo, São Paulo, Brasil',
  ]);

  const ClearSearchIcon = ({ color }: { color: string }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6L18 18"/>
    </Svg>
  );

  const handleSearch = () => {
    if (searchText && !recentSearches.includes(searchText)) {
      setRecentSearches([searchText, ...recentSearches.slice(0, 4)]);
    }
    console.log('Pesquisando por:', searchText);
  };

  interface ClearRecentSearchProps {
    itemToClear: string;
  }

  const clearRecentSearch = (itemToClear: ClearRecentSearchProps['itemToClear']): void => {
    setRecentSearches(recentSearches.filter((item: string) => item !== itemToClear));
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.searchPageHeader}>
        <Text style={styles.searchPageTitle}>Pesquisar</Text>
      </View>

      <View style={styles.modernSearchInputContainer}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.modernSearchIcon}>
          <Circle cx="11" cy="11" r="8" />
          <Path d="M21 21L16.65 16.65" />
        </Svg>
        <TextInput
          style={styles.modernSearchInput}
          placeholder="Pesquisar"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.modernClearSearchButton}>
            <ClearSearchIcon color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.recentSearchesContainer}>
        {recentSearches.length > 0 && (
          <>
            <Text style={styles.recentSearchesTitle}>PESQUISAS RECENTES</Text>
            {recentSearches.map((item, index) => (
              <View key={index} style={styles.recentSearchItem}>
                <TouchableOpacity onPress={() => setSearchText(item)} style={styles.recentSearchTextContainer}>
                  <Text style={styles.recentSearchText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => clearRecentSearch(item)} style={styles.recentSearchClearButton}>
                  <ClearSearchIcon color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Componente da Tela de Perfil ---
const ProfileScreen = ({ navigation }: { navigation: ProfileScreenNavigationProp }) => {
  const handleLogout = () => {
    console.log('Logout simulado!');
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={styles.profileScreenContainer}>
      <View style={styles.profileHeaderBar}>
        <Text style={styles.profileHeaderTitle}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.profileContentContainer}>
        <View style={styles.profileHeader}>
          <Image
            source={require('./assets/perfil.jpg')}
            style={styles.profileImage}
          />
          <TouchableOpacity>
            <Text style={styles.changeProfileImageText}>Mudar imagem de perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileDetailsList}>
          <TouchableOpacity style={styles.profileDetailRow}>
            <Text style={styles.profileDetailLabel}>Nome</Text>
            <Text style={styles.profileDetailValue}>Inacio Silva</Text>
            <Text style={styles.profileDetailArrow}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileDetailRow}>
            <Text style={styles.profileDetailLabel}>Username</Text>
            <Text style={styles.profileDetailValue}>@inacio_luz</Text>
            <Text style={styles.profileDetailArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileDetailRow}>
            <Text style={styles.profileDetailLabel}>Email</Text>
            <Text style={styles.profileDetailValue}>inaciosilva@gmail.com</Text>
            <Text style={styles.profileDetailArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileDetailRow}>
            <Text style={styles.profileDetailLabel}>Bio</Text>
            <Text style={styles.profileDetailValue}>Turistando pela cidade de Santos!</Text>
            <Text style={styles.profileDetailArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileDetailRow}>
            <Text style={styles.profileDetailLabel}>Premium</Text>
            <Text style={styles.profileDetailValue}>Assinatura ativada</Text>
            <Text style={styles.profileDetailArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.profileDetailRow, styles.lastProfileDetailRow]}>
            <Text style={styles.profileDetailLabel}>Configurações</Text>
            <Text style={styles.profileDetailArrow}>&gt;</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, styles.logoutButtonProfile]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Componente que contém as Abas de Navegação (Bottom Tabs) ---
const MainTabs = () => {
  const MapIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21.75S4 14.5 4 10.5C4 6.35786 7.58172 3 12 3C16.4183 3 20 6.35786 20 10.5C20 14.5 12 21.75 12 21.75Z" />
      <Circle cx="12" cy="10.5" r="3" />
    </Svg>
  );

  const SearchIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Path d="M21 21L16.65 16.65" />
    </Svg>
  );

  const ProfileIcon = ({ color }: { color: string }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
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
          if (route.name === 'Map') {
            return <MapIcon color={color} />;
          } else if (route.name === 'Search') {
            return <SearchIcon color={color} />;
          } else if (route.name === 'Profile') {
            return <ProfileIcon color={color} />;
          }
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

// --- Componente Principal da Aplicação ---
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

// --- Estilos da Aplicação ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    width: '100%',
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginVertical: 20,
  },
  infoBlock: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  logo: {
    width: 400,
    height: 200,
    marginBottom: 40,
  },
  input: {
    width: '80%',
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#D31570',
    width: '80%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    marginTop: 20,
    color: '#D31570',
    fontSize: 16,
  },
  // Estilos do mapa
  mapContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
  },
  loadingMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mapSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Estilos para as novas telas (Search e Profile)
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 15,
  },
  // --- Estilos para a Tela de Pesquisa ---
  searchPageHeader: {
    width: '100%',
    backgroundColor: '#8A2BE2',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  searchPageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modernSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFF4',
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  modernSearchIcon: {
    marginRight: 10,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  modernClearSearchButton: {
    marginLeft: 10,
    padding: 5,
  },
  modernClearSearchText: {
    fontSize: 18,
    color: '#888',
  },
  recentSearchesContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 10,
    marginLeft: 5,
  },
  recentSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentSearchTextContainer: {
    flex: 1,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
  },
  recentSearchClearButton: {
    padding: 5,
  },
  recentSearchClearIcon: {
    fontSize: 16,
    color: '#888',
  },
  // --- Estilos para a Tela de Perfil ---
  profileScreenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeaderBar: {
    width: '100%',
    backgroundColor: '#8A2BE2',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  profileHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileContentContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  changeProfileImageText: {
    color: '#8A2BE2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileDetailsList: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastProfileDetailRow: {
    borderBottomWidth: 0,
  },
  profileDetailLabel: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  profileDetailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginRight: 10,
  },
  profileDetailArrow: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  logoutButtonProfile: {
    marginTop: 30,
    backgroundColor: '#dc3545',
  },
  // Estilos do modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgb(255, 255, 255)',
  },
  modalView: { // Este é o container principal do modal, que será um card com bordas arredondadas
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%', // Ocupa a largura total do centeredView (90%)
    maxHeight: '90%', // Permite que o modal seja alto o suficiente, mas com margem
    overflow: 'hidden', // Importante para que as bordas arredondadas funcionem com o carrossel de imagens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 0, // Removido padding superior para que a imagem encoste na borda
    paddingHorizontal: 0, // Removido padding horizontal para que a imagem encoste na borda
    paddingBottom: 20, // Mantém o padding inferior para o botão
    
  },
  modalScrollViewContent: { // Novo estilo para o conteúdo interno do ScrollView do modal
    alignItems: 'center',
    paddingBottom: 20, // Espaçamento extra no final do conteúdo
  },
  modalTitle: { // Título principal (Educandário Anália Franco) - ESTILO ANTIGO
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
    width: '100%',
  },
  modalTitleModern: { // Novo estilo para o título do patrimônio
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15, // Espaçamento superior após a imagem/carrossel
    marginBottom: 5,
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 20, // Padding para alinhar com o conteúdo
  },
  modalAddress: { // Novo estilo para o endereço
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 20, // Padding para alinhar com o conteúdo
  },
  // Estilos do carrossel de imagens no modal
  imageCarouselContainer: {
    width: '100%', // Ocupa a largura total do modal
    height: 200, // Altura fixa para o carrossel
    marginBottom: 0, // Removido o espaçamento para que a imagem encoste na borda superior do modal
    borderRadius: 0, // Removido o arredondamento aqui, pois ele é feito no modalImageModern
    overflow: 'hidden',
  },
  imageCarouselScrollView: {
    width: '100%',
    height: '100%',
  },
  modalImageModern: { // Estilo para cada imagem dentro do carrossel
    width: screenWidth * 0.9, // A imagem deve ter a largura do modal para `pagingEnabled`
    height: '100%',
    resizeMode: 'cover',
    borderTopLeftRadius: 20, // Arredondamento superior esquerdo
    borderTopRightRadius: 20, // Arredondamento superior direito
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    position: 'absolute',
    bottom: 5,
    width: '100%',
  },
  dot: {
    color: '#ccc',
    marginHorizontal: 5,
    fontSize: 18,
  },
  activeDot: {
    color: '#8A2BE2',
    marginHorizontal: 5,
    fontSize: 18,
  },
  // Estilos para as seções (SOBRE, APARECE EM)
  sectionContainer: {
    width: '100%',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20, // Adicionado padding horizontal
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
  },
  appearsInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  appearsInText: {
    fontSize: 16,
    color: '#333',
  },
  appearsInRating: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  // Estilos para os detalhes do patrimônio (lista abaixo de SOBRE/APARECE EM)
  heritageDetailsContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    paddingHorizontal: 20, // Padding para alinhar com o conteúdo
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: '35%',
  },
  detailValue: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    textAlign: 'left',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  buttonClose: {
    backgroundColor: '#A432C0', // Cor roxa
    width: '80%', // Ocupa 80% do modal
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    
  },
  modalContent: { // ESTILO ANTIGO (já existia mas não estava em uso no modal principal)
    alignItems: 'center',
    paddingBottom: 20,
  },
    buttonContainer: {
    width: '100%', // O container ocupa a largura total do modalView
    alignItems: 'center', // Centraliza o conteúdo (o botão) dentro deste container
    marginTop: 15, // Espaçamento superior para separar do conteúdo acima (ScrollView)
    paddingHorizontal: 20, // Opcional: Se você quiser que o botão respeite o padding horizontal do modal
  },
});