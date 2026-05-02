"""LUSTRO Field System backend tests.
Covers: root, clientes CRUD, visitas CRUD with filters, contratos numbering & confirmar_final.
No ObjectId leakage check is implicit (Pydantic models won't include _id).
"""
import pytest
import requests
from datetime import datetime, timedelta
from .conftest import BASE_URL


# ---------- ROOT ----------
class TestRoot:
    def test_root_returns_app(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get('app') == 'LUSTRO Field System'
        assert data.get('status') == 'ok'


# ---------- CLIENTES CRUD ----------
class TestClientes:
    cliente_id = None

    def test_create_cliente(self, api_client):
        payload = {
            'nome': 'TEST_Cliente Teste',
            'morada': 'Rua das Flores 123, 4700-100 Braga',
            'localidade': 'Braga',
            'contacto': '912345678',
            'email': 'teste@test.pt',
        }
        r = api_client.post(f"{BASE_URL}/api/clientes", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data['nome'] == payload['nome']
        assert data['morada'] == payload['morada']
        assert data['localidade'] == 'Braga'
        assert 'id' in data and len(data['id']) >= 8
        assert '_id' not in data
        TestClientes.cliente_id = data['id']

    def test_list_clientes_includes_created(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/clientes")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = [c['id'] for c in items]
        assert TestClientes.cliente_id in ids
        for c in items:
            assert '_id' not in c

    def test_get_cliente(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/clientes/{TestClientes.cliente_id}")
        assert r.status_code == 200
        data = r.json()
        assert data['id'] == TestClientes.cliente_id
        assert '_id' not in data

    def test_update_cliente(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/clientes/{TestClientes.cliente_id}",
                           json={'notas': 'TEST_atualizado'})
        assert r.status_code == 200
        # GET to verify persistence
        r2 = api_client.get(f"{BASE_URL}/api/clientes/{TestClientes.cliente_id}")
        assert r2.json()['notas'] == 'TEST_atualizado'

    def test_get_cliente_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/clientes/nope-xyz")
        assert r.status_code == 404


# ---------- VISITAS CRUD with filters ----------
class TestVisitas:
    cliente_id = None
    visita_hoje_id = None
    visita_amanha_id = None

    def test_setup_create_cliente(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/clientes", json={
            'nome': 'TEST_VisitaCliente',
            'morada': 'Av. Liberdade 200, 1250-100 Lisboa',
            'localidade': 'Lisboa',
        })
        assert r.status_code == 200
        TestVisitas.cliente_id = r.json()['id']

    def test_create_visita_hoje(self, api_client):
        hoje = datetime.now().strftime('%Y-%m-%d')
        r = api_client.post(f"{BASE_URL}/api/visitas", json={
            'cliente_id': TestVisitas.cliente_id,
            'data': hoje,
            'hora': '15:00',
            'notas': 'TEST_visita hoje',
        })
        assert r.status_code == 200
        data = r.json()
        assert data['data'] == hoje
        assert data['hora'] == '15:00'
        assert '_id' not in data
        TestVisitas.visita_hoje_id = data['id']

    def test_create_visita_amanha(self, api_client):
        amanha = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        r = api_client.post(f"{BASE_URL}/api/visitas", json={
            'cliente_id': TestVisitas.cliente_id,
            'data': amanha,
            'hora': '09:30',
        })
        assert r.status_code == 200
        TestVisitas.visita_amanha_id = r.json()['id']

    def test_list_visitas_filter_data(self, api_client):
        hoje = datetime.now().strftime('%Y-%m-%d')
        r = api_client.get(f"{BASE_URL}/api/visitas", params={'data': hoje})
        assert r.status_code == 200
        items = r.json()
        assert all(v['data'] == hoje for v in items)
        ids = [v['id'] for v in items]
        assert TestVisitas.visita_hoje_id in ids

    def test_list_visitas_filter_cliente(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/visitas", params={'cliente_id': TestVisitas.cliente_id})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 2
        for v in items:
            assert v['cliente_id'] == TestVisitas.cliente_id

    def test_update_visita(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/visitas/{TestVisitas.visita_hoje_id}",
                           json={'estado': 'concluida'})
        assert r.status_code == 200
        r2 = api_client.get(f"{BASE_URL}/api/visitas/{TestVisitas.visita_hoje_id}")
        assert r2.json()['estado'] == 'concluida'

    def test_delete_cliente_cascades_visitas(self, api_client):
        # eliminate cliente -> visitas should be deleted
        r = api_client.delete(f"{BASE_URL}/api/clientes/{TestVisitas.cliente_id}")
        assert r.status_code == 200
        # both visitas should be 404 now
        r1 = api_client.get(f"{BASE_URL}/api/visitas/{TestVisitas.visita_hoje_id}")
        r2 = api_client.get(f"{BASE_URL}/api/visitas/{TestVisitas.visita_amanha_id}")
        assert r1.status_code == 404
        assert r2.status_code == 404


# ---------- CONTRATOS numbering ----------
class TestContratos:
    contrato_a_id = None
    contrato_b_id = None
    initial_numero = None

    def test_proximo_numero_initial(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero")
        assert r.status_code == 200
        data = r.json()
        assert data['ano'] == datetime.now().year
        assert isinstance(data['numero'], int)
        assert data['ref'].startswith(f"CONT-{datetime.now().year}-")
        TestContratos.initial_numero = data['numero']

    def test_create_contrato_no_consume(self, api_client):
        # criar 2 contratos provisorios; ambos devem mostrar a mesma ref previsionada
        r1 = api_client.post(f"{BASE_URL}/api/contratos", json={
            'cliente_nome': 'TEST_ClienteA',
            'valor': 50.0,
            'periodicidade': 'mensal',
        })
        assert r1.status_code == 200, r1.text
        c1 = r1.json()
        assert c1['final'] is False
        TestContratos.contrato_a_id = c1['id']

        r2 = api_client.post(f"{BASE_URL}/api/contratos", json={
            'cliente_nome': 'TEST_ClienteB',
            'valor': 100.0,
            'periodicidade': 'quinzenal',
        })
        assert r2.status_code == 200
        c2 = r2.json()
        assert c2['final'] is False
        TestContratos.contrato_b_id = c2['id']

        # proximo numero ainda igual ao inicial
        r = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero")
        assert r.json()['numero'] == TestContratos.initial_numero

    def test_finalizar_contrato_via_confirmar_final(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/contratos/{TestContratos.contrato_a_id}",
                           json={'confirmar_final': True})
        assert r.status_code == 200
        data = r.json()
        assert data['final'] is True
        # numero no proximo-numero deve ter avancado em +1
        r2 = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero")
        assert r2.json()['numero'] == TestContratos.initial_numero + 1

    def test_finalizar_via_estado_assinado(self, api_client):
        r = api_client.put(f"{BASE_URL}/api/contratos/{TestContratos.contrato_b_id}",
                           json={'estado': 'assinado'})
        assert r.status_code == 200
        data = r.json()
        assert data['final'] is True
        assert data['estado'] == 'assinado'
        # avanca outro
        r2 = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero")
        assert r2.json()['numero'] == TestContratos.initial_numero + 2

    def test_re_finalizar_nao_consome(self, api_client):
        # actualizar contrato ja final novamente nao deve consumir numero
        before = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero").json()['numero']
        r = api_client.put(f"{BASE_URL}/api/contratos/{TestContratos.contrato_a_id}",
                           json={'confirmar_final': True})
        assert r.status_code == 200
        after = api_client.get(f"{BASE_URL}/api/contratos/proximo-numero").json()['numero']
        assert before == after

    def test_listar_contratos_no_objectid(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/contratos")
        assert r.status_code == 200
        for c in r.json():
            assert '_id' not in c

    def test_cleanup_delete_contratos(self, api_client):
        for cid in [TestContratos.contrato_a_id, TestContratos.contrato_b_id]:
            r = api_client.delete(f"{BASE_URL}/api/contratos/{cid}")
            assert r.status_code == 200
