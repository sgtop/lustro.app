from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="LUSTRO Field System API")
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ========================= MODELS =========================

class ClienteBase(BaseModel):
    nome: str
    morada: Optional[str] = ""
    localidade: Optional[str] = ""
    contacto: Optional[str] = ""
    email: Optional[str] = ""
    nif: Optional[str] = ""
    notas: Optional[str] = ""


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    morada: Optional[str] = None
    localidade: Optional[str] = None
    contacto: Optional[str] = None
    email: Optional[str] = None
    nif: Optional[str] = None
    notas: Optional[str] = None


class Cliente(ClienteBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    criado_em: str = Field(default_factory=now_iso)


class VisitaBase(BaseModel):
    cliente_id: str
    data: str  # YYYY-MM-DD
    hora: str  # HH:MM
    notas: Optional[str] = ""
    estado: Optional[str] = "agendada"  # agendada, concluida, cancelada


class VisitaCreate(VisitaBase):
    pass


class VisitaUpdate(BaseModel):
    cliente_id: Optional[str] = None
    data: Optional[str] = None
    hora: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[str] = None


class Visita(VisitaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    criado_em: str = Field(default_factory=now_iso)


class ContratoBase(BaseModel):
    cliente_id: Optional[str] = None
    cliente_nome: Optional[str] = ""
    valor: Optional[float] = 0
    periodicidade: Optional[str] = "mensal"  # mensal | quinzenal
    estado: Optional[str] = "gerado"  # gerado | assinado
    data: Optional[str] = ""  # data do contrato (display)


class ContratoCreate(ContratoBase):
    ref: Optional[str] = None  # se vazio, gera automaticamente


class ContratoUpdate(BaseModel):
    cliente_id: Optional[str] = None
    cliente_nome: Optional[str] = None
    valor: Optional[float] = None
    periodicidade: Optional[str] = None
    estado: Optional[str] = None
    data: Optional[str] = None
    ref: Optional[str] = None
    confirmar_final: Optional[bool] = None


class Contrato(ContratoBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ref: str
    final: bool = False  # quando True a numeração foi consumida
    criado_em: str = Field(default_factory=now_iso)


# ========================= HELPERS =========================

PROJ = {"_id": 0}


async def proximo_numero_contrato(ano: int) -> int:
    counter = await db.contrato_counters.find_one({"ano": ano}, PROJ)
    if not counter:
        return 1
    return int(counter.get("ultimo_numero", 0)) + 1


async def consumir_numero_contrato(ano: int) -> int:
    """Aumenta o contador e devolve o novo numero."""
    counter = await db.contrato_counters.find_one({"ano": ano})
    if not counter:
        await db.contrato_counters.insert_one({"ano": ano, "ultimo_numero": 1})
        return 1
    novo = int(counter.get("ultimo_numero", 0)) + 1
    await db.contrato_counters.update_one({"ano": ano}, {"$set": {"ultimo_numero": novo}})
    return novo


def format_ref_contrato(ano: int, numero: int) -> str:
    return f"CONT-{ano}-{numero:03d}"


# ========================= ROOT =========================

@api_router.get("/")
async def root():
    return {"app": "LUSTRO Field System", "status": "ok"}


# ========================= CLIENTES =========================

@api_router.get("/clientes", response_model=List[Cliente])
async def listar_clientes():
    items = await db.clientes.find({}, PROJ).sort("nome", 1).to_list(2000)
    return [Cliente(**i) for i in items]


@api_router.post("/clientes", response_model=Cliente)
async def criar_cliente(payload: ClienteCreate):
    c = Cliente(**payload.dict())
    await db.clientes.insert_one(c.dict())
    return c


@api_router.get("/clientes/{cliente_id}", response_model=Cliente)
async def obter_cliente(cliente_id: str):
    item = await db.clientes.find_one({"id": cliente_id}, PROJ)
    if not item:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Cliente(**item)


@api_router.put("/clientes/{cliente_id}", response_model=Cliente)
async def atualizar_cliente(cliente_id: str, payload: ClienteUpdate):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    res = await db.clientes.update_one({"id": cliente_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    item = await db.clientes.find_one({"id": cliente_id}, PROJ)
    return Cliente(**item)


@api_router.delete("/clientes/{cliente_id}")
async def eliminar_cliente(cliente_id: str):
    res = await db.clientes.delete_one({"id": cliente_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    # eliminar visitas associadas
    await db.visitas.delete_many({"cliente_id": cliente_id})
    return {"ok": True}


# ========================= VISITAS =========================

@api_router.get("/visitas", response_model=List[Visita])
async def listar_visitas(data: Optional[str] = None, cliente_id: Optional[str] = None):
    query = {}
    if data:
        query["data"] = data
    if cliente_id:
        query["cliente_id"] = cliente_id
    items = await db.visitas.find(query, PROJ).sort([("data", 1), ("hora", 1)]).to_list(2000)
    return [Visita(**i) for i in items]


@api_router.post("/visitas", response_model=Visita)
async def criar_visita(payload: VisitaCreate):
    v = Visita(**payload.dict())
    await db.visitas.insert_one(v.dict())
    return v


@api_router.get("/visitas/{visita_id}", response_model=Visita)
async def obter_visita(visita_id: str):
    item = await db.visitas.find_one({"id": visita_id}, PROJ)
    if not item:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    return Visita(**item)


@api_router.put("/visitas/{visita_id}", response_model=Visita)
async def atualizar_visita(visita_id: str, payload: VisitaUpdate):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    res = await db.visitas.update_one({"id": visita_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    item = await db.visitas.find_one({"id": visita_id}, PROJ)
    return Visita(**item)


@api_router.delete("/visitas/{visita_id}")
async def eliminar_visita(visita_id: str):
    res = await db.visitas.delete_one({"id": visita_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    return {"ok": True}


# ========================= CONTRATOS =========================

@api_router.get("/contratos/proximo-numero")
async def get_proximo_numero():
    ano = datetime.now().year
    proximo = await proximo_numero_contrato(ano)
    return {"ano": ano, "numero": proximo, "ref": format_ref_contrato(ano, proximo)}


@api_router.get("/contratos", response_model=List[Contrato])
async def listar_contratos():
    items = await db.contratos.find({}, PROJ).sort("criado_em", -1).to_list(2000)
    return [Contrato(**i) for i in items]


@api_router.post("/contratos", response_model=Contrato)
async def criar_contrato(payload: ContratoCreate):
    """Cria um contrato em estado provisório.
    A referência é apenas previsionada — o número só é consumido quando
    o utilizador confirmar como final ou marcar como assinado."""
    ano = datetime.now().year
    if payload.ref and payload.ref.strip():
        ref = payload.ref.strip()
    else:
        proximo = await proximo_numero_contrato(ano)
        ref = format_ref_contrato(ano, proximo)

    data_contrato = payload.data or datetime.now().strftime("%Y-%m-%d")
    contrato = Contrato(
        ref=ref,
        cliente_id=payload.cliente_id,
        cliente_nome=payload.cliente_nome or "",
        valor=payload.valor or 0,
        periodicidade=payload.periodicidade or "mensal",
        estado=payload.estado or "gerado",
        data=data_contrato,
        final=False,
    )
    await db.contratos.insert_one(contrato.dict())
    return contrato


@api_router.put("/contratos/{contrato_id}", response_model=Contrato)
async def atualizar_contrato(contrato_id: str, payload: ContratoUpdate):
    item = await db.contratos.find_one({"id": contrato_id}, PROJ)
    if not item:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")

    update = {k: v for k, v in payload.dict().items() if v is not None and k != "confirmar_final"}

    confirmar_final = payload.confirmar_final
    novo_estado = payload.estado

    deve_consumir = False
    if not item.get("final"):
        if confirmar_final is True:
            deve_consumir = True
        elif novo_estado == "assinado":
            deve_consumir = True

    if deve_consumir:
        ano = datetime.now().year
        # se a ref ainda corresponde ao próximo número, consumir
        proximo = await proximo_numero_contrato(ano)
        ref_esperada = format_ref_contrato(ano, proximo)
        # consumimos sempre o próximo número quando finalizamos pela 1ª vez
        await consumir_numero_contrato(ano)
        update["final"] = True
        # se ref do contrato ainda não tem numero válido ou o utilizador não mudou, alinhamos
        if not item.get("ref") or item.get("ref") == ref_esperada:
            update["ref"] = ref_esperada

    if update:
        await db.contratos.update_one({"id": contrato_id}, {"$set": update})

    item = await db.contratos.find_one({"id": contrato_id}, PROJ)
    return Contrato(**item)


@api_router.delete("/contratos/{contrato_id}")
async def eliminar_contrato(contrato_id: str):
    res = await db.contratos.delete_one({"id": contrato_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    return {"ok": True}


# ========================= INCLUDE & MIDDLEWARE =========================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
