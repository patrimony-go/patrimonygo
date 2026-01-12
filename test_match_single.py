# test_match_single.py
import re, unicodedata
from rapidfuzz import fuzz
import firebase_admin
from firebase_admin import credentials, firestore

CREDENTIALS_PATH = 'private_key.json'
COLLECTION = 'patrimonios_santos'
FILE_NAME = 'Necropole Ecumênica.jpg'   # ajuste se precisar

def normalize(s: str) -> str:
    if not s:
        return ''
    s = re.sub(r'\.[A-Za-z0-9]+$', '', s)  # remove extensão
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r'[^0-9A-Za-z\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s

# init firebase
cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

group_base = FILE_NAME.rsplit(' ', 1)[0]
if group_base == FILE_NAME:
    group_base = FILE_NAME.rsplit('.', 1)[0]
group_norm = normalize(group_base)
print('Group base:', repr(group_base))
print('Group norm:', repr(group_norm))
print('---\nBuscando melhores candidatos no Firestore...')

docs = list(db.collection(COLLECTION).stream())
candidates = []
for d in docs:
    data = d.to_dict() or {}
    name = data.get('name') or data.get('title') or ''
    name_norm = normalize(name)
    s_token_set = fuzz.token_set_ratio(group_norm, name_norm)
    s_token_sort = fuzz.token_sort_ratio(group_norm, name_norm)
    s_partial = fuzz.partial_ratio(group_norm, name_norm)
    best = max(s_token_set, s_token_sort, s_partial)
    candidates.append((best, s_token_set, s_token_sort, s_partial, d.id, name, name_norm))

candidates.sort(reverse=True, key=lambda x: x[0])

print('\nTop 10 candidatos:')
for i, (best, ts, tso, p, doc_id, name, name_norm) in enumerate(candidates[:10], 1):
    print(f'{i:2d}) best={int(best):3d} token_set={int(ts):3d} token_sort={int(tso):3d} partial={int(p):3d}  doc_id={doc_id}  name="{name}"')
