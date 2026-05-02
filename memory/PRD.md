# LUSTRO Field System — PRD

## Visão Geral
App mobile (Expo SDK 54) para gestão operacional do serviço LUSTRO de manutenção
profissional de vidros e fachadas envidraçadas. Permite gerir clientes, visitas e
gerar/partilhar 5 documentos oficiais em PDF com layout premium em formato A4.

## Stack
- **Frontend**: Expo Router 6, React Native 0.81, TypeScript, expo-print, expo-sharing
- **Backend**: FastAPI + Motor + MongoDB
- **PDFs**: gerados no cliente via `expo-print` a partir de templates HTML (1 página A4)
- **Partilha**: `expo-sharing` (share sheet nativo: WhatsApp, Email, etc.)

## Funcionalidades

### 1. Dashboard "Hoje"
- Cartões: nº visitas Hoje · Amanhã · Clientes
- Lista de visitas de **Hoje** no formato `15:00 — Cliente (Localidade)`
- Lista de visitas de **Amanhã**
- **Alerta visual** amarelo no topo quando existem serviços para amanhã
- **Popup leve** 1x por sessão a avisar dos serviços de amanhã

### 2. Clientes
- CRUD completo com nome, morada, localidade, contacto, email, NIF, notas
- Auto-extração de localidade a partir da morada (fallback)
- Lista filtrável + perfil com visitas associadas
- Botão **Abrir no Waze** + atalho para nova visita

### 3. Agenda
- Vista por dias (15 dias para a frente + ontem)
- Lista de visitas no formato `15:00 — Cliente (Localidade)`
- Botão **Abrir no Waze** por visita
- Eliminar visita

### 4. Documentos (5 tipos)
1. **Proposta de Manutenção** — corrigida (sem listas duplicadas no fim)
2. **Contrato de Manutenção** — com referência **CONT-2026-XXX**
3. **Tabela de Preços · B2B** — tipologias de espaço com valores mensais
4. **Manutenção Residencial** — tipologias por área de vidro
5. **Limpeza Técnica Pós-Obra** — classificação por complexidade

Cada documento permite:
- **Pré-visualizar** (WebView)
- **Gerar PDF** (expo-print)
- **Partilhar** (expo-sharing → share sheet nativo)
- Imprimir (web)

### 5. Periodicidade e Valor (Proposta + Contrato)
- Checkbox visual `☐ Mensal (1x/mês)` · `☐ Quinzenal (2x/mês)`
- Linha visível para preenchimento manual do valor acordado em €
- Layout compacto e premium

### 6. Sistema de Referências de Contrato
- Formato automático `CONT-2026-NNN`
- Edição manual permitida
- Numeração só avança quando:
  - Utilizador clica **"Confirmar como final"**, ou
  - Utilizador marca contrato como **"assinado"** no histórico
- **Histórico** com `Ref · Cliente · Data · Estado (gerado/assinado/final)`

## Estrutura
```
backend/
  server.py              # FastAPI app + modelos UUID + CRUD
  tests/test_lustro.py   # 20 testes (passing)

frontend/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      index.tsx          # Dashboard Hoje + Amanhã + alerta + popup
      clientes.tsx
      agenda.tsx
      documentos.tsx
    cliente/{new,[id]}.tsx
    visita/new.tsx
    documento/[type].tsx # Preview + PDF + Partilha + Confirmar Final
    contratos/historico.tsx
  src/lib/
    theme.ts
    api.ts
    locality.ts          # extractLocalidade + clienteLocalidade
    pdf.ts               # gerarPdf + partilharPdf
    templates.ts         # 5 documentos HTML premium
```

## Endpoints (todos com prefixo `/api`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api/ | Healthcheck |
| GET/POST/PUT/DELETE | /api/clientes[/{id}] | CRUD clientes |
| GET/POST/PUT/DELETE | /api/visitas[/{id}] | CRUD visitas (filtros: ?data, ?cliente_id) |
| GET | /api/contratos/proximo-numero | Pré-visualiza próxima referência |
| GET/POST/PUT/DELETE | /api/contratos[/{id}] | CRUD contratos + `confirmar_final` |

## Estado Final
- ✅ Backend: 20/20 testes a passar
- ✅ Frontend: todas as 4 tabs funcionais
- ✅ 5 documentos premium integrados com layout fiel ao original
- ✅ PDF + partilha via share sheet nativo
- ✅ CONT-2026-XXX automático com botão manual "Confirmar como final"
- ✅ Alerta visual + popup amanhã no dashboard
- ✅ Botão Waze (com fallback "Morada em falta")
- ✅ Localidade extraída automaticamente da morada

## Como Testar
1. Abrir Expo Go com o QR code do tunnel ou aceder à preview web
2. Criar cliente em **Clientes → +** (com morada de Oeiras/Cascais p/ ver auto-localidade)
3. Criar visita para hoje e amanhã em **Agenda → +**
4. Voltar ao **Dashboard "Hoje"** → ver alerta amarelo + listas + popup (1x sessão)
5. Em qualquer visita, tocar **"Waze"** para abrir navegação
6. **Documentos** → escolher cada um dos 5 → preencher cliente/valor/periodicidade
7. **Gerar PDF** ou **Partilhar** (share sheet)
8. No Contrato, alterar dados, gerar PDF (estado=gerado), depois clicar **"Confirmar como final"**
9. Ver **Histórico de Contratos** — referência avançou para CONT-2026-002

## Próximos Passos (sugestões)
- Notificação push diária ao final do dia a recordar visitas de amanhã
- Anexar fotografias por visita (antes/depois) e incluí-las no contrato
- Exportação CSV mensal de visitas concluídas
