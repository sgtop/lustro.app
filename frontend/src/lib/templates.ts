// Templates HTML premium dos 5 documentos LUSTRO.
// Cada função devolve um documento HTML completo, optimizado para A4 e expo-print.

export type DocOpts = {
  ref?: string;
  data?: string; // YYYY-MM-DD
  cliente?: {
    nome?: string;
    morada?: string;
    nif?: string;
    email?: string;
    contacto?: string;
    cidade?: string;
    cp?: string;
  };
  periodicidade?: 'mensal' | 'quinzenal';
  valor?: number | string;
};

const BASE_CSS = `
  @page { size: A4; margin: 14mm 14mm 14mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: #111; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-size: 9.5pt; line-height: 1.45; letter-spacing: 0.1pt; }
  .page { padding: 0; }
  .brand { font-family: 'Georgia', 'Times New Roman', serif; letter-spacing: 4pt; font-weight: 600; }
  .label { font-size: 7pt; letter-spacing: 1.2pt; color: #888; text-transform: uppercase; font-weight: 600; }
  .value { font-size: 10pt; color: #111; font-weight: 500; }
  .h-rule { border-bottom: 0.6pt solid #000; }
  .row { display: flex; }
  .col { flex: 1; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10pt; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10pt; border-bottom: 1.5pt solid #000; margin-bottom: 14pt; }
  .header .lustro { font-family: Georgia, serif; font-size: 18pt; letter-spacing: 4pt; font-weight: 600; }
  .header .doc-tag { text-align: right; }
  .doc-tag .small { font-size: 7pt; letter-spacing: 1.5pt; color: #666; text-transform: uppercase; }
  .doc-tag .big { font-size: 11pt; letter-spacing: 2pt; text-transform: uppercase; font-weight: 600; }
  .title-block { margin: 6pt 0 14pt; }
  .title-block h1 { font-family: Georgia, serif; font-size: 22pt; font-weight: 500; color: #111; line-height: 1.1; }
  .title-block .sub { font-size: 9pt; color: #555; margin-top: 4pt; }
  .meta-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18pt; padding: 10pt 0; border-top: 0.6pt solid #ddd; border-bottom: 0.6pt solid #ddd; margin-bottom: 14pt; }
  .section { margin-bottom: 12pt; }
  .section h2 { font-size: 8.5pt; letter-spacing: 1.6pt; color: #111; text-transform: uppercase; font-weight: 700; padding-bottom: 4pt; border-bottom: 0.6pt solid #000; margin-bottom: 8pt; }
  .section .body { font-size: 9pt; color: #1d1d1d; line-height: 1.5; }
  .clauses .clause { margin-bottom: 8pt; }
  .clauses .clause .num { font-size: 8.5pt; letter-spacing: 1.5pt; text-transform: uppercase; font-weight: 700; color: #111; }
  .clauses .clause .num small { letter-spacing: 0; font-weight: 500; color: #555; margin-left: 6pt; text-transform: none; font-size: 8pt; }
  .clauses .clause p { font-size: 8.8pt; color: #1f1f1f; margin-top: 2pt; line-height: 1.45; text-align: justify; }
  .checkbox-row { display: flex; gap: 16pt; align-items: center; padding: 6pt 0; }
  .cb { display: inline-flex; align-items: center; gap: 6pt; font-size: 9.5pt; }
  .cb .box { width: 11pt; height: 11pt; border: 1pt solid #111; display: inline-block; }
  .valor-line { display: flex; align-items: flex-end; gap: 8pt; margin-top: 6pt; }
  .valor-line .lab { font-size: 9pt; color: #111; font-weight: 600; }
  .valor-line .line { flex: 1; border-bottom: 0.8pt solid #111; height: 14pt; }
  .valor-line .eur { font-size: 11pt; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; margin-top: 16pt; }
  .sig-box { border-top: 0.8pt solid #000; padding-top: 6pt; min-height: 56pt; }
  .sig-box .role { font-size: 7pt; letter-spacing: 1.6pt; text-transform: uppercase; color: #555; }
  .sig-box .name { font-size: 9.5pt; color: #111; margin-top: 2pt; font-weight: 600; }
  .sig-box .data { font-size: 8pt; color: #444; margin-top: 18pt; }
  .footer { margin-top: 14pt; padding-top: 10pt; border-top: 0.6pt solid #ddd; font-size: 7.5pt; color: #555; letter-spacing: 0.6pt; display: flex; justify-content: space-between; }
  .footer .brand-mini { font-family: Georgia, serif; letter-spacing: 3pt; font-weight: 600; color: #111; font-size: 8pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6pt 8pt; text-align: left; vertical-align: middle; font-size: 9pt; }
  thead th { font-size: 7.5pt; letter-spacing: 1.3pt; text-transform: uppercase; color: #555; border-bottom: 1pt solid #111; }
  tbody tr { border-bottom: 0.4pt solid #e3e3e3; }
  tbody tr:last-child { border-bottom: 0; }
  tbody td.right, thead th.right { text-align: right; }
  .pill { display: inline-block; padding: 2pt 8pt; border: 0.6pt solid #111; border-radius: 30pt; font-size: 7.5pt; letter-spacing: 1.2pt; text-transform: uppercase; font-weight: 600; }
  .lead { font-size: 9.4pt; color: #1d1d1d; line-height: 1.55; }
  .accent-num { font-family: Georgia, serif; font-size: 14pt; color: #111; font-weight: 600; letter-spacing: 1pt; }
  .gold-line { height: 1.5pt; background: #c9a96a; margin: 8pt 0 12pt; width: 60pt; }
  .bullets { list-style: none; padding: 0; }
  .bullets li { padding: 3pt 0 3pt 14pt; position: relative; font-size: 9pt; color: #1d1d1d; line-height: 1.5; }
  .bullets li::before { content: ""; position: absolute; left: 0; top: 9pt; width: 5pt; height: 1pt; background: #c9a96a; }
  .bullets li small { color: #777; font-size: 8pt; display: block; margin-top: 1pt; }
  .panel { padding: 10pt 12pt; background: #fafafa; border-left: 2pt solid #c9a96a; }
  .table-classic td.bold, .table-classic th.bold { font-weight: 700; color: #111; }
`;

const FOOTER = `
  <div class="footer">
    <div class="brand-mini">L U S T R O</div>
    <div>contacto@vidrobrilho.com · +351 934 833 023 · NIF 219 689 067 · lustro.vidrobrilho.com</div>
  </div>
`;

function shell(body: string) {
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${BASE_CSS}</style></head><body><div class="page">${body}</div></body></html>`;
}

function fmtData(d?: string): string {
  if (!d) return '___ / ___ / _____';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  return `${m[3]} / ${m[2]} / ${m[1]}`;
}

function valorFmt(v?: number | string): string {
  if (v === undefined || v === null || v === '') return '_______';
  if (typeof v === 'string') return v;
  return v.toFixed(2).replace('.', ',');
}

function periodicidadeBlock(periodicidade?: string, valor?: number | string) {
  const isMensal = periodicidade === 'mensal' || !periodicidade;
  const isQuinz = periodicidade === 'quinzenal';
  const fillM = isMensal ? '✓' : '';
  const fillQ = isQuinz ? '✓' : '';
  return `
    <div class="checkbox-row">
      <span class="cb"><span class="box">${fillM}</span> Mensal (1x por mês)</span>
      <span class="cb"><span class="box">${fillQ}</span> Quinzenal (2x por mês)</span>
    </div>
    <div class="valor-line">
      <span class="lab">Valor acordado:</span>
      <span class="line">${valor !== undefined && valor !== '' ? `&nbsp;${valorFmt(valor)}` : ''}</span>
      <span class="eur">€</span>
    </div>
  `;
}

// ============================================================
// 1) PROPOSTA DE MANUTENÇÃO  (corrigida — sem listas no fim)
// ============================================================
export function htmlProposta(opts: DocOpts = {}): string {
  const ref = opts.ref || 'PROP-2026-001';
  const data = fmtData(opts.data);
  const c = opts.cliente || {};
  return shell(`
    <div class="header">
      <div>
        <div class="lustro">L U S T R O</div>
        <div class="label" style="margin-top:4pt;">Manutenção profissional de vidros e fachadas envidraçadas</div>
      </div>
      <div class="doc-tag">
        <div class="small">Documento Comercial 2026</div>
        <div class="big">Proposta de Manutenção</div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="label">Referência</div><div class="value">${ref}</div></div>
      <div><div class="label">Data</div><div class="value">${data}</div></div>
      <div><div class="label">Validade</div><div class="value">7 dias</div></div>
    </div>

    <div class="title-block">
      <h1>Proposta para manutenção contínua de superfícies envidraçadas</h1>
      <div class="gold-line"></div>
      <div class="sub">Serviço técnico focado em manutenção contínua de superfícies envidraçadas, com controlo operacional e padrão definido.</div>
    </div>

    <div class="section">
      <h2>Para</h2>
      <div class="grid-2">
        <div>
          <div class="label">Empresa</div>
          <div class="value">${c.nome || '_______________________________'}</div>
        </div>
        <div>
          <div class="label">NIF</div>
          <div class="value">${c.nif || '_______________________________'}</div>
        </div>
        <div>
          <div class="label">Morada</div>
          <div class="value">${c.morada || '_______________________________'}</div>
        </div>
        <div>
          <div class="label">Pessoa de Contacto</div>
          <div class="value">${c.contacto || '_______________________________'}</div>
        </div>
        <div>
          <div class="label">Email</div>
          <div class="value">${c.email || '_______________________________'}</div>
        </div>
        <div>
          <div class="label">Cidade · Código Postal</div>
          <div class="value">${[c.cidade, c.cp].filter(Boolean).join(' · ') || '_______________________________'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Âmbito do Serviço</h2>
      <p class="lead">Serviço técnico focado em manutenção contínua de superfícies envidraçadas, com controlo operacional e padrão definido.</p>
    </div>

    <div class="section">
      <h2>Serviço Técnico</h2>
      <ul class="bullets">
        <li><strong>Manutenção profissional de vidros e fachadas</strong><small>Limpeza interior e exterior · molduras e acessórios</small></li>
        <li><strong>Remoção de depósitos e manchas minerais</strong><small>Calcário, salino, escorrências — conforme exposição</small></li>
        <li><strong>Revisão técnica de qualidade</strong><small>Verificação no final de cada intervenção</small></li>
      </ul>
    </div>

    <div class="section">
      <h2>Plano de Manutenção Mensal</h2>
      <p class="lead">Serviço prestado em regime recorrente com:</p>
      <ul class="bullets">
        <li>Intervenção em dia e janela horária definida</li>
        <li>Limpeza de vidros e caixilharias visíveis</li>
        <li>Execução com padrão consistente</li>
        <li>Verificação final após cada visita</li>
        <li>Registo de serviço — confirmação e fotos quando aplicável</li>
      </ul>
      <p class="lead" style="margin-top:6pt;">Objetivo: garantir manutenção contínua da imagem do espaço sem necessidade de acompanhamento por parte do cliente.</p>
    </div>

    <div class="section">
      <h2>Periodicidade e Valor</h2>
      ${periodicidadeBlock(opts.periodicidade, opts.valor)}
    </div>

    <div class="section">
      <h2>Transparência e Controlo</h2>
      <ul class="bullets">
        <li>Aviso no momento da intervenção</li>
        <li>Confirmação após conclusão</li>
        <li>Registo visual quando aplicável</li>
      </ul>
      <p class="lead" style="margin-top:6pt;">A LUSTRO elimina a necessidade de supervisão do serviço por parte do cliente.</p>
    </div>

    <div class="section">
      <div class="grid-4">
        <div><div class="label">Regime Fiscal</div><div class="value">Isenção de IVA — Art.º 53.º</div></div>
        <div><div class="label">Contrato Mínimo</div><div class="value">3 meses, renovável</div></div>
        <div><div class="label">Deslocações</div><div class="value">Oeiras · Cascais · Sintra · Gr. Lisboa</div></div>
        <div><div class="label">Pagamento</div><div class="value">Débito direto · MBWay · Transferência</div></div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="role">Cliente · Assinatura e carimbo</div>
        <div class="data">Data: ___ / ___ / _____</div>
      </div>
      <div class="sig-box">
        <div class="role">Prestador</div>
        <div class="name">Sandro Gomes · LUSTRO</div>
        <div class="data">Data: ___ / ___ / _____</div>
      </div>
    </div>

    ${FOOTER}
  `);
}

// ============================================================
// 2) CONTRATO DE MANUTENÇÃO
// ============================================================
export function htmlContrato(opts: DocOpts = {}): string {
  const ref = opts.ref || 'CONT-2026-001';
  const data = fmtData(opts.data);
  const c = opts.cliente || {};
  return shell(`
    <div class="header">
      <div>
        <div class="lustro">L U S T R O</div>
        <div class="label" style="margin-top:4pt;">Manutenção periódica de vidros e fachadas envidraçadas</div>
      </div>
      <div class="doc-tag">
        <div class="small">Documento Contratual 2026</div>
        <div class="big">Contrato de Manutenção</div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="label">Referência</div><div class="value">${ref}</div></div>
      <div><div class="label">Data</div><div class="value">${data}</div></div>
      <div><div class="label">Duração Inicial</div><div class="value">3 meses</div></div>
    </div>

    <div class="grid-2 section">
      <div>
        <h2>Prestador</h2>
        <div class="label" style="margin-top:2pt;">Designação</div>
        <div class="value">LUSTRO — Manutenção Profissional de Vidros</div>
        <div class="label" style="margin-top:6pt;">Morada</div>
        <div class="value">Praceta Estado da Baía, Sintra</div>
        <div class="label" style="margin-top:6pt;">NIF</div>
        <div class="value">219 689 067</div>
        <div class="label" style="margin-top:6pt;">Representante</div>
        <div class="value">Sandro Gomes</div>
      </div>
      <div>
        <h2>Cliente</h2>
        <div class="label" style="margin-top:2pt;">Razão Social</div>
        <div class="value">${c.nome || '_______________________________'}</div>
        <div class="label" style="margin-top:6pt;">NIF</div>
        <div class="value">${c.nif || '_______________________________'}</div>
        <div class="label" style="margin-top:6pt;">Morada</div>
        <div class="value">${c.morada || '_______________________________'}</div>
        <div class="label" style="margin-top:6pt;">Email · Telefone</div>
        <div class="value">${[c.email, c.contacto].filter(Boolean).join(' · ') || '_______________________________'}</div>
      </div>
    </div>

    <div class="section clauses">
      <h2>Termos e Condições</h2>
      <div class="clause"><div class="num">Cláusula 1<small>Objeto</small></div>
        <p>Manutenção periódica profissional de vidros, fachadas envidraçadas, molduras e acessórios, utilizando equipamento profissional Unger e água de baixa mineralização (TDS 0), preservando a integridade das superfícies.</p></div>
      <div class="clause"><div class="num">Cláusula 2<small>Periodicidade</small></div>
        <p>A frequência será definida conforme acordo operacional. A LUSTRO compromete-se a executar o serviço em regime recorrente com calendário estável, garantindo continuidade e previsibilidade da manutenção.</p></div>
      <div class="clause"><div class="num">Cláusula 3<small>Execução e Padrão de Serviço</small></div>
        <p>O serviço será executado segundo um padrão consistente, incluindo limpeza de vidros, caixilharias e zonas visíveis associadas, com verificação final após cada intervenção. A execução não depende de supervisão do cliente.</p></div>
      <div class="clause"><div class="num">Cláusula 4<small>Comunicação e Registo</small></div>
        <p>A LUSTRO assegura comunicação operacional antes e após cada intervenção, incluindo confirmação da realização do serviço, registo de conclusão e envio de registo visual quando aplicável. Qualquer falha comunicada até 24 horas será corrigida sem custo adicional.</p></div>
      <div class="clause"><div class="num">Cláusula 5<small>Pagamento</small></div>
        <p>Preferencial por débito direto automático. Alternativas: MBWay ou transferência bancária. Pagamento até ao dia 5 de cada mês. Atraso superior a 5 dias autoriza suspensão temporária do serviço.</p></div>
      <div class="clause"><div class="num">Cláusula 6<small>Duração e Rescisão</small></div>
        <p>Duração inicial mínima de 3 meses, com renovação automática mensal. Rescisão requer aviso prévio escrito de 30 dias por qualquer das partes.</p></div>
      <div class="clause"><div class="num">Cláusula 7<small>Responsabilidade e Enquadramento Fiscal</small></div>
        <p>A LUSTRO garante execução profissional com metodologia adequada à preservação dos vidros e elementos adjacentes. Os valores correspondem a valores base de serviço; ao valor acordado acresce IVA à taxa legal em vigor, quando aplicável. Caso ocorra alteração do enquadramento fiscal, nomeadamente cessação do regime de isenção (Art.º 53.º CIVA), o IVA passará a ser automaticamente aplicado, sem necessidade de renegociação contratual.</p></div>
      <div class="clause"><div class="num">Cláusula 8<small>Atualização de Condições</small></div>
        <p>O presente contrato poderá ser ajustado em função de alterações legais, fiscais ou operacionais que impactem diretamente a prestação do serviço, mediante comunicação prévia ao cliente.</p></div>
    </div>

    <div class="section">
      <h2>Periodicidade e Valor</h2>
      ${periodicidadeBlock(opts.periodicidade, opts.valor)}
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="role">Cliente · Representante Legal · Assinatura e Carimbo</div>
        <div class="data">Data: ___ / ___ / _____</div>
      </div>
      <div class="sig-box">
        <div class="role">Prestador</div>
        <div class="name">Sandro Gomes · LUSTRO</div>
        <div class="data">Data: ___ / ___ / _____</div>
      </div>
    </div>

    ${FOOTER}
  `);
}

// ============================================================
// 3) TABELA DE PREÇOS · B2B
// ============================================================
export function htmlTabelaB2B(): string {
  return shell(`
    <div class="header">
      <div>
        <div class="lustro">L U S T R O</div>
        <div class="label" style="margin-top:4pt;">Contratos recorrentes de manutenção profissional de vidros</div>
      </div>
      <div class="doc-tag">
        <div class="small">Segmento Comercial 2026</div>
        <div class="big">Tabela de Preços · B2B</div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="label">Validade</div><div class="value">2026</div></div>
      <div><div class="label">Segmento</div><div class="value">Comercial B2B</div></div>
      <div><div class="label">Regime</div><div class="value">Plano Mensal</div></div>
    </div>

    <div class="title-block">
      <h1>Preços mensais base · contratos de manutenção periódica</h1>
      <div class="gold-line"></div>
      <div class="sub">Valores ajustáveis conforme o estado real do vidro no local, após visita técnica gratuita.</div>
    </div>

    <div class="section">
      <h2>Preços por Tipologia de Espaço · Plano Mensal</h2>
      <table class="table-classic">
        <thead>
          <tr>
            <th>Tipo de Espaço</th>
            <th>Dimensão</th>
            <th class="right">Valor Mensal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Loja pequena</strong><br/><small style="color:#666">Ótica · Barbershop · Farmácia</small></td><td>20 – 40 m²</td><td class="right bold">120 €</td></tr>
          <tr><td><strong>Loja média</strong><br/><small style="color:#666">Cabeleireiro · Sapataria</small></td><td>40 – 80 m²</td><td class="right bold">150 €</td></tr>
          <tr><td><strong>Loja grande</strong><br/><small style="color:#666">Moda · Vestuário · Multimarca</small></td><td>80 – 150 m²</td><td class="right bold">180 €</td></tr>
          <tr><td><strong>Clínica · Consultório médico</strong><br/><small style="color:#666">Exigência sanitária e estética elevada</small></td><td>60 – 120 m²</td><td class="right bold">160 €</td></tr>
          <tr><td><strong>Ginásio · Estúdio de fitness</strong><br/><small style="color:#666">Espelhos e vidros de grandes dimensões</small></td><td>150 – 300 m²</td><td class="right bold">200 €</td></tr>
          <tr><td><strong>Escritório · Showroom</strong><br/><small style="color:#666">Recepção e áreas de atendimento</small></td><td>50 – 100 m²</td><td class="right bold">140 €</td></tr>
          <tr><td><strong>Condomínio · Áreas comuns</strong><br/><small style="color:#666">Átrio, portaria e acessos envidraçados</small></td><td>200+ m²</td><td class="right bold">240 €</td></tr>
        </tbody>
      </table>
      <div class="panel" style="margin-top:8pt;">Plano quinzenal disponível para espaços com maior exigência de manutenção, definido em função da necessidade operacional.</div>
    </div>

    <div class="section">
      <div class="grid-4">
        <div><div class="label">Regime Fiscal</div><div class="value">Isenção de IVA — Art.º 53.º CIVA</div></div>
        <div><div class="label">Contrato Mínimo</div><div class="value">3 meses, renovável</div></div>
        <div><div class="label">Área de Atuação</div><div class="value">Oeiras · Cascais · Sintra · Gr. Lisboa</div></div>
        <div><div class="label">Visita Técnica</div><div class="value">Gratuita · Orçamento exato</div></div>
      </div>
    </div>

    <div class="section">
      <h2>O que inclui cada intervenção</h2>
      <ul class="bullets">
        <li><strong>Limpeza técnica completa</strong><small>Vidros, caixilhos, espelhos e superfícies vitrificadas — interior e exterior acessível.</small></li>
        <li><strong>Revisão técnica de qualidade</strong><small>Inspeção no final de cada visita e comunicação de eventuais anomalias ao cliente.</small></li>
        <li><strong>Equipamento profissional</strong><small>Sistema Unger e água de baixa mineralização (TDS 0) — zero escorrências ou marcas.</small></li>
        <li><strong>Calendário fixo garantido</strong><small>Visitas agendadas com regularidade mensal — previsibilidade operacional total.</small></li>
      </ul>
    </div>

    ${FOOTER}
  `);
}

// ============================================================
// 4) MANUTENÇÃO RESIDENCIAL
// ============================================================
export function htmlResidencial(): string {
  return shell(`
    <div class="header">
      <div>
        <div class="lustro">L U S T R O</div>
        <div class="label" style="margin-top:4pt;">Manutenção profissional de vidros e envidraçados residenciais</div>
      </div>
      <div class="doc-tag">
        <div class="small">Segmento Residencial — Moradias</div>
        <div class="big">Manutenção Residencial</div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="label">Validade</div><div class="value">2026</div></div>
      <div><div class="label">Segmento</div><div class="value">Residencial · Moradias</div></div>
      <div><div class="label">Regime</div><div class="value">Manutenção Mensal</div></div>
    </div>

    <div class="title-block">
      <h1>Manutenção profissional para habitações</h1>
      <div class="gold-line"></div>
      <div class="sub">Serviço profissional de manutenção de vidros, janelas, portas envidraçadas, espelhos e superfícies vitrificadas em habitações unifamiliares, apartamentos e condomínios residenciais. Inclui remoção de calcário, manchas minerais e inspeção técnica regular.</div>
    </div>

    <div class="section">
      <h2>Preços Mensais por Área Útil Envidraçada</h2>
      <table>
        <thead>
          <tr>
            <th>Área de Vidro</th>
            <th>Tipologia</th>
            <th class="right">Valor Mensal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>25 – 35 m²</td><td><strong>T0 · T1 pequeno</strong> Apartamento compacto</td><td class="right bold">280 €</td></tr>
          <tr><td>35 – 50 m²</td><td><strong>T1</strong> Apartamento standard</td><td class="right bold">320 €</td></tr>
          <tr><td>40 – 60 m²</td><td><strong>T1 · T2 médio</strong> Apartamento médio · duplex</td><td class="right bold">340 €</td></tr>
          <tr><td>50 – 70 m²</td><td><strong>T2</strong> Apartamento ou moradia pequena</td><td class="right bold">360 €</td></tr>
          <tr><td>70 m² ou +</td><td><strong>T3 +</strong> Moradia · penthouse · villa</td><td class="right bold">400 €</td></tr>
        </tbody>
      </table>
      <div class="panel" style="margin-top:8pt;">Plano personalizado disponível mediante necessidade específica. Metodologia profissional com equipamento Unger e água de baixa mineralização (TDS 0), preservando caixilhos, silicones e superfícies adjacentes. Todas as visitas incluem inspeção técnica e relatório resumido ao proprietário.</div>
    </div>

    <div class="section">
      <div class="grid-4">
        <div><div class="label">Regime Fiscal</div><div class="value">Isenção de IVA — Art.º 53.º CIVA</div></div>
        <div><div class="label">Área de Atuação</div><div class="value">Oeiras · Cascais · Sintra · Gr. Lisboa</div></div>
        <div><div class="label">Visita Técnica</div><div class="value">Gratuita · Avaliação exata</div></div>
        <div><div class="label">Pagamento</div><div class="value">Débito direto · MBWay · Transferência</div></div>
      </div>
    </div>

    <div class="section">
      <h2>Serviço Inclui</h2>
      <ul class="bullets">
        <li><strong>Vidros e envidraçados</strong><small>Janelas, portas, sacadas, marquises e estores — interior e exterior acessível.</small></li>
        <li><strong>Remoção técnica</strong><small>Calcário, manchas minerais, poeiras e resíduos salinos de exposição marítima.</small></li>
        <li><strong>Espelhos e superfícies</strong><small>Espelhos interiores, resguardos de banho e bancadas vitrificadas.</small></li>
        <li><strong>Inspeção e relatório</strong><small>Verificação das superfícies e comunicação de eventuais anomalias ao proprietário.</small></li>
      </ul>
    </div>

    ${FOOTER}
  `);
}

// ============================================================
// 5) LIMPEZA TÉCNICA PÓS-OBRA
// ============================================================
export function htmlPosObra(): string {
  return shell(`
    <div class="header">
      <div>
        <div class="lustro">L U S T R O</div>
        <div class="label" style="margin-top:4pt;">Limpeza de vidros pós-construção e remodelação</div>
      </div>
      <div class="doc-tag">
        <div class="small">Serviço Pontual Técnico 2026</div>
        <div class="big">Limpeza Técnica Pós-Obra</div>
      </div>
    </div>

    <div class="meta-strip">
      <div><div class="label">Validade</div><div class="value">2026</div></div>
      <div><div class="label">Serviço</div><div class="value">Pós-Obra</div></div>
      <div><div class="label">Duração</div><div class="value">4 — 8 horas</div></div>
    </div>

    <div class="title-block">
      <h1>Limpeza técnica especializada após obra ou remodelação</h1>
      <div class="gold-line"></div>
      <div class="sub">Limpeza técnica especializada de vidros, fachadas envidraçadas e acessórios em edifícios recém-construídos ou remodelados. Remoção de resíduos de obra — cimento, calcário, tintas, adesivos e selantes — com metodologia profissional adequada à preservação das superfícies e elementos adjacentes.</div>
    </div>

    <div class="section">
      <h2>Classificação por Complexidade</h2>
      <table>
        <thead>
          <tr><th>Classificação</th><th>Tipologia e Exemplos</th><th class="right">Valor</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Pequena</strong></td><td>Apartamento T1 — T2 com vidros simples<br/><small style="color:#666">Resíduos superficiais · acesso direto pelo interior</small></td><td class="right bold">250 €</td></tr>
          <tr><td><strong>Média</strong></td><td>Loja · escritório · vidros duplos<br/><small style="color:#666">Remoção de cimento, silicones e adesivos de película</small></td><td class="right bold">400 €</td></tr>
          <tr><td><strong>Grande</strong></td><td>Edifício com múltiplas frentes envidraçadas<br/><small style="color:#666">Fachadas, montras e acessos · trabalho em altura baixa a média</small></td><td class="right bold">600 €</td></tr>
          <tr><td><strong>Muito complexa</strong></td><td>Edifício comercial de grandes dimensões<br/><small style="color:#666">Intervenção multi-visita · planeamento técnico dedicado</small></td><td class="right bold">700 € +</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Nota Técnica · Metodologia e Garantia</h2>
      <p class="lead">Valor final ajustado após visita prévia ao nível de sujidade, tipo de resíduos e complexidade de acesso. Utilização exclusiva de equipamento profissional Unger e produtos especializados compatíveis com o tratamento dos vidros. Revisão técnica de qualidade incluída nas 48 horas seguintes à intervenção, sempre que aplicável.</p>
    </div>

    <div class="section">
      <div class="grid-4">
        <div><div class="label">Regime Fiscal</div><div class="value">Isenção de IVA — Art.º 53.º CIVA</div></div>
        <div><div class="label">Agendamento</div><div class="value">Mediante marcação prévia</div></div>
        <div><div class="label">Cobertura</div><div class="value">Oeiras · Cascais · Sintra · Gr. Lisboa</div></div>
        <div><div class="label">Orçamento</div><div class="value">Exato após visita técnica gratuita</div></div>
      </div>
    </div>

    <div class="section">
      <h2>Intervenção Inclui</h2>
      <ul class="bullets">
        <li><strong>Remoção de resíduos de obra</strong><small>Cimento, reboco, tintas, adesivos de película e selantes de silicone.</small></li>
        <li><strong>Preservação de caixilhos</strong><small>Metodologia compatível com alumínio lacado, PVC, madeira e aço — sem abrasivos.</small></li>
        <li><strong>Tratamento de depósitos minerais</strong><small>Calcário, salitre e escorrências acumuladas durante o período de obra.</small></li>
        <li><strong>Revisão pós-intervenção</strong><small>Verificação técnica nas 48 horas seguintes — ajustes sem custo adicional.</small></li>
      </ul>
    </div>

    ${FOOTER}
  `);
}

// Definição dos documentos disponíveis
export const DOC_TYPES = [
  { key: 'proposta',    titulo: 'Proposta de Manutenção',     subtitulo: 'Documento Comercial 2026',      hasContrato: true,  hasContratoRef: false, isProposta: true,  fn: htmlProposta },
  { key: 'contrato',    titulo: 'Contrato de Manutenção',     subtitulo: 'Documento Contratual 2026',     hasContrato: true,  hasContratoRef: true,  isProposta: false, fn: htmlContrato },
  { key: 'tabela-b2b',  titulo: 'Tabela de Preços · B2B',     subtitulo: 'Segmento Comercial 2026',       hasContrato: false, hasContratoRef: false, isProposta: false, fn: (_o: DocOpts) => htmlTabelaB2B() },
  { key: 'residencial', titulo: 'Manutenção Residencial',     subtitulo: 'Segmento Residencial 2026',     hasContrato: false, hasContratoRef: false, isProposta: false, fn: (_o: DocOpts) => htmlResidencial() },
  { key: 'pos-obra',    titulo: 'Limpeza Técnica Pós-Obra',   subtitulo: 'Serviço Pontual Técnico 2026',  hasContrato: false, hasContratoRef: false, isProposta: false, fn: (_o: DocOpts) => htmlPosObra() },
] as const;

export type DocKey = typeof DOC_TYPES[number]['key'];

export function getDocType(key: string) {
  return DOC_TYPES.find((d) => d.key === key);
}
