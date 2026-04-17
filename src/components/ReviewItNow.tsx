"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── STORAGE KEY ──────────────────────────────────────────────────────────────
const PLAYBOOK_KEY = "reviewitnow_playbook";

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const FREE_SYSTEM = `You are a senior transactional attorney. Analyze this contract and return ONLY a JSON object — no other text, no markdown.

{
  "documentType": "e.g. Software License Agreement",
  "parties": "e.g. Acme Corp (Licensor) and Customer Inc (Licensee)",
  "governingJurisdiction": "e.g. Delaware",
  "effectiveDate": "e.g. January 1, 2025 or Unknown",
  "jurisdictionNote": "2-3 sentences on key state-specific rules for this jurisdiction and contract type",
  "recommendation": "SIGN AS-IS" or "SIGN WITH MODIFICATIONS" or "DO NOT SIGN",
  "recommendationRationale": "One sentence",
  "criticalIssues": [
    {
      "name": "Issue name — keep short, 2-4 words",
      "type": "BUSINESS" or "LEGAL" or "LINKAGE",
      "risk": "HIGH" or "MEDIUM" or "LOW",
      "summary": "One plain-language sentence for a business owner",
      "sourceKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "crossoverFlags": [
    { "agent": "employment" or "litigation", "issue": "Issue name", "reason": "Why" }
  ]
}

CRITICAL: For each issue include 2-4 sourceKeywords — short lowercase strings that will uniquely identify the clause text in the contract.
Return 5-9 critical issues. Apply all user context. Write in plain language.`;

const ANALYZE_SYSTEM = `You are a senior transactional attorney with 25+ years at elite law firms.

GENERAL CONTRACT LAW: Formation, interpretation (contra proferentem, parol evidence, good faith), performance and breach (material vs. minor, substantial performance, anticipatory repudiation), remedies (expectation damages, Hadley v. Baxendale, liquidated damages, specific performance, limitation of liability), excuse (force majeure, impossibility, frustration).

PRACTICE AREAS: Corporate (LLC agreements, M&A, buy-sell, equity plans, Delaware DGCL, Wyoming LLC Act), venture finance (SAFEs, convertible notes, priced rounds, NVCA docs, anti-dilution, liquidation preferences), securities (Reg D/A+/CF, accredited investor, blue sky), fund formation (LP agreements, carried interest, SPVs, side letters), IP (trademark assignment/licensing, copyright, patents, trade secrets, CIIAAs, NDAs, DTSA), entertainment (recording agreements, music publishing, sync licensing, film/TV, talent, merchandising, influencer), real estate (commercial leases, PSAs, SNDAs, estoppels, personal guarantees, 1031, SBA loans, CMBS, construction), commercial (MSAs, SaaS, vendor, franchise, employment, independent contractor).

JURISDICTION: Delaware (DGCL, BJ rule, entire fairness, Revlon, Unocal, Corwin), NC (non-competes not blue-penciled, deed of trust, Chapter 75 treble damages), CA (§16600 non-competes void, AB5, anti-deficiency CCP §580b, CUTSA), NY (good guy guarantee, NYC RPTT, rent stabilization, §5-1401), FL (homestead Art. X §4, §542.335 non-competes, sales tax on commercial rent), TX (community property, 21-day foreclosure, §15.50 non-competes), WY (strongest LLC charging order, no income tax), NV (NRS §613.195 non-competes restricted), GA (§13-8-53 non-competes, security deed), IL (Freedom to Work Act 2022), MA (Noncompetition Act 2018, garden leave).

CLASSIFICATION: [BUSINESS] commercial decision. [LEGAL] legal doctrine or statute. [LINKAGE] business choice creates legal consequence. Risk: [HIGH] [MEDIUM] [LOW]. Status: GREEN (acceptable), YELLOW (negotiate), RED (escalate).

OUTPUT — these sections in order:

PART I: CLAUSE-BY-CLAUSE ANALYSIS
For every material clause:
CLAUSE: [name] | STATUS: [GREEN/YELLOW/RED] | TYPE: [BUSINESS/LEGAL/LINKAGE] | RISK: [HIGH/MEDIUM/LOW]
What it says: [plain English]
Standard position: [market standard or playbook position if provided]
Deviation: [what differs and why it matters]
Business impact: [practical consequence]

Cover at minimum: Limitation of Liability, Indemnification, IP Ownership, Data Protection, Confidentiality, Representations & Warranties, Term & Termination, Governing Law & Dispute Resolution, Assignment, Force Majeure, Payment Terms.

PART II: BUSINESS TO LEGAL LINKAGE MAP
LINKAGE: [title] | RISK: [HIGH/MEDIUM/LOW]
Business decision: [the commercial choice]
Legal consequence: [what it triggers — cite statute/doctrine]
Recommendation: [how to protect]

PART III: NEGOTIATION PLAYBOOK
Tier 1 — Must-Have: [non-negotiables]
Tier 2 — Should-Have: [strong positions]
Tier 3 — Nice-to-Have: [concession candidates]
Strategy: [tactical advice for this specific deal]

If a custom playbook was provided, review every clause against those positions and call out each deviation explicitly.
Write in plain language for a smart business owner.`;

const REDLINE_SYSTEM = `You are a senior transactional attorney. Return ONLY a valid JSON array — no other text, no markdown.

For each material issue:
{
  "clauseName": "Short clause name",
  "sectionRef": "Section number if visible",
  "originalText": "EXACT verbatim text — must match character for character including apostrophes",
  "replacementText": "Exact replacement",
  "comment": "Why this change matters — plain language for a business owner",
  "status": "RED" or "YELLOW" or "GREEN",
  "type": "BUSINESS" or "LEGAL" or "LINKAGE",
  "risk": "HIGH" or "MEDIUM" or "LOW",
  "priority": "MUST-HAVE" or "SHOULD-HAVE" or "NICE-TO-HAVE"
}

Keep originalText as short as possible while uniquely identifying the change. Return 5-15 redlines. Return ONLY a JSON array.`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  label: string;
  desc: string;
  color: string;
  light: string;
  border: string;
}

const AGENTS: Record<string, Agent> = {
  contract:   { id:"contract",   label:"Contract Review",      desc:"Any commercial agreement",       color:"#1A3A5C", light:"#EBF0F6", border:"#B8CCE0" },
  employment: { id:"employment", label:"Employment Law",       desc:"Claims, agreements & disputes",  color:"#1A5C3A", light:"#EBF5EF", border:"#B8D9C4" },
  litigation: { id:"litigation", label:"Corporate Litigation", desc:"Chancery, disputes & IP",        color:"#7A4A0A", light:"#FDF4E7", border:"#E8C88A" },
};
const ROLES: Record<string, string[]> = {
  contract:   ["Buyer / Customer","Seller / Vendor","Licensor","Licensee","Landlord","Tenant","Employer","Employee","Investor","Founder / Company","Lender","Borrower","Artist / Talent","Label / Studio","Other"],
  employment: ["Employee","Employer / Company","HR Professional","Founder / Executive","Other"],
  litigation: ["Plaintiff","Defendant","Board / Director","Shareholder / Investor","Company","Other"],
};
const FOCUS_AREAS: Record<string, string[]> = {
  contract:   ["Liability & indemnification","IP ownership","Payment terms","Termination rights","Data protection","Non-compete","Governing law","Confidentiality","All clauses"],
  employment: ["Discrimination / harassment","Wage & hour","Non-compete enforceability","Separation agreement","FMLA / leave","Whistleblower claims","All issues"],
  litigation: ["Fiduciary duty claims","Trade secret","Non-compete enforcement","Breach of contract","IP infringement","Shareholder dispute","Delaware Chancery","All issues"],
};
const JURISDICTIONS = ["Auto-detect","Delaware","North Carolina","California","New York","Florida","Texas","Wyoming","Nevada","Georgia","Illinois","Massachusetts"];
const DEFAULT_PLAYBOOK = "";
const PLAYBOOK_PLACEHOLDER = `e.g.
Liability cap: 12 months of fees paid
Consequential damages: mutual exclusion required
Indemnification: mutual, capped at liability cap
IP ownership: each party retains pre-existing IP`;

const C = {
  bg:"#FAFAF9", surface:"#FFFFFF", border:"#E8E4DD", borderMid:"#D0CBC2",
  text:"#1A1714", textMid:"#6B6560", textSub:"#9E9890",
  navy:"#1A3A5C", navyLt:"#EBF0F6",
  green:"#1A5C3A", greenLt:"#EBF5EF",
  amber:"#7A4A0A", amberLt:"#FDF4E7",
  high:"#B91C1C", highBg:"#FEF2F2", highBorder:"#FCA5A5",
  med:"#92400E",  medBg:"#FFFBEB",  medBorder:"#FCD34D",
  low:"#065F46",  lowBg:"#ECFDF5",  lowBorder:"#6EE7B7",
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Paragraph {
  id: string;
  style: string;
  text: string;
  runs: { text: string; bold: boolean; italic: boolean }[];
  isHeading: boolean;
  headingLevel: number | null;
}

interface CriticalIssue {
  name: string;
  type: string;
  risk: string;
  summary: string;
  sourceKeywords?: string[];
}

interface CrossoverFlag {
  agent: string;
  issue: string;
  reason: string;
}

interface FreeAnalysisData {
  documentType?: string;
  parties?: string;
  governingJurisdiction?: string;
  effectiveDate?: string;
  jurisdictionNote?: string;
  recommendation?: string;
  recommendationRationale?: string;
  criticalIssues?: CriticalIssue[];
  crossoverFlags?: CrossoverFlag[];
}

interface RedlineItem {
  clauseName: string;
  sectionRef?: string;
  originalText: string;
  replacementText: string;
  comment: string;
  status: string;
  type: string;
  risk: string;
  priority: string;
  commentId?: number;
  changeId?: number;
  done?: boolean;
}

// ─── XML / DOCX UTILITIES ─────────────────────────────────────────────────────
function escXml(s: string) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function unescXml(s: string) { return String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'"); }

function parseDocxStructure(xml: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const paraRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
  let m: RegExpExecArray | null, idx = 0;
  while ((m = paraRegex.exec(xml)) !== null) {
    const pxml = m[0];
    const styleM = pxml.match(/<w:pStyle w:val="([^"]+)"/);
    const style = styleM ? styleM[1] : 'Normal';
    const texts: { text: string; bold: boolean; italic: boolean }[] = [];
    const runR = /<w:r\b[\s\S]*?<\/w:r>/g;
    let rm: RegExpExecArray | null;
    while ((rm = runR.exec(pxml)) !== null) {
      const rxml = rm[0];
      if (rxml.includes('<w:delText')) continue;
      const tms = rxml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      const bold = /<w:b\/>|<w:b w:/.test(rxml);
      const italic = /<w:i\/>|<w:i w:/.test(rxml);
      for (const t of tms) {
        const text = t.replace(/<w:t[^>]*>/,'').replace(/<\/w:t>/,'');
        if (text) texts.push({ text, bold, italic });
      }
    }
    const fullText = unescXml(texts.map(t=>t.text).join(''));
    if (fullText.trim()) {
      const hl = style.match(/Heading(\d)/i)?.[1];
      const isTitle = /^Title$/i.test(style);
      paragraphs.push({ id:`p_${idx++}`, style, text:fullText, runs:texts, isHeading:!!hl||isTitle, headingLevel:hl?parseInt(hl):(isTitle?0:null) });
    }
  }
  return paragraphs;
}

function matchClauseToParaId(issueName: string, keywords: string[] | undefined, paragraphs: Paragraph[]): string | null {
  const kws = (keywords||[]).map(k=>k.toLowerCase());
  const nameWords = issueName.toLowerCase().split(/\s+/);
  for (const p of paragraphs) {
    if (!p.isHeading) continue;
    const lt = p.text.toLowerCase();
    if (kws.some(k=>lt.includes(k)) || nameWords.every(w=>lt.includes(w))) return p.id;
  }
  for (const p of paragraphs) {
    const lt = p.text.toLowerCase();
    if (kws.some(k=>lt.includes(k))) return p.id;
  }
  for (const p of paragraphs) {
    const lt = p.text.toLowerCase();
    if (nameWords.filter(w=>w.length>3).every(w=>lt.includes(w))) return p.id;
  }
  return null;
}

function getParagraphText(paraXml: string) {
  return unescXml((paraXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)||[]).map(m=>m.replace(/<w:t[^>]*>/,'').replace(/<\/w:t>/,'')).join(''));
}
function extractRPr(paraXml: string) {
  const m = paraXml.match(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/);
  if (!m) return '';
  const r = m[1].match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  return r ? r[0] : '';
}
function injectTrackedChange(paraXml: string, searchText: string, replacementText: string, commentId: number, changeId: number, author: string, date: string) {
  const paraText = getParagraphText(paraXml);
  if (!paraText.includes(searchText)) return null;
  const before = paraText.slice(0, paraText.indexOf(searchText));
  const after = paraText.slice(paraText.indexOf(searchText) + searchText.length);
  const rPr = extractRPr(paraXml);
  const pPr = (paraXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[''])[0];
  let p = `<w:p>${pPr}`;
  if (before) p += `<w:r>${rPr}<w:t xml:space="preserve">${escXml(before)}</w:t></w:r>`;
  p += `<w:commentRangeStart w:id="${commentId}"/>`;
  p += `<w:del w:id="${changeId}" w:author="${escXml(author)}" w:date="${date}"><w:r>${rPr}<w:delText xml:space="preserve">${escXml(searchText)}</w:delText></w:r></w:del>`;
  p += `<w:ins w:id="${changeId+1}" w:author="${escXml(author)}" w:date="${date}"><w:r>${rPr}<w:t xml:space="preserve">${escXml(replacementText)}</w:t></w:r></w:ins>`;
  p += `<w:commentRangeEnd w:id="${commentId}"/>`;
  p += `<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${commentId}"/></w:r>`;
  if (after) p += `<w:r>${rPr}<w:t xml:space="preserve">${escXml(after)}</w:t></w:r>`;
  return p + `</w:p>`;
}

declare global {
  interface Window {
    JSZip: any;
  }
}

async function applyRedlinesToDocx(docxBuffer: ArrayBuffer, redlines: RedlineItem[]) {
  if (typeof window === 'undefined') return { blob: null, applied: [], notApplied: redlines };
  const JSZip = window.JSZip;
  const zip = await JSZip.loadAsync(docxBuffer);
  let docXml = await zip.file("word/document.xml").async("string");
  const author="ReviewItNow", date=new Date().toISOString().slice(0,19)+"Z";
  const parts: { t: string; c: string }[] = [];
  const pr=/<w:p\b[\s\S]*?<\/w:p>/g;
  let last=0, m: RegExpExecArray | null;
  while((m=pr.exec(docXml))!==null){if(m.index>last)parts.push({t:'o',c:docXml.slice(last,m.index)});parts.push({t:'p',c:m[0]});last=m.index+m[0].length;}
  if(last<docXml.length)parts.push({t:'o',c:docXml.slice(last)});
  const applied: RedlineItem[]=[], pending=redlines.map((r,i)=>({...r,commentId:i,changeId:i*2+1}));
  for(let i=0;i<parts.length;i++){
    if(parts[i].t!=='p')continue;
    const pt=getParagraphText(parts[i].c);
    for(let ri=pending.length-1;ri>=0;ri--){
      const r=pending[ri];
      if(r.done||!pt.includes(r.originalText))continue;
      const np=injectTrackedChange(parts[i].c,r.originalText,r.replacementText,r.commentId!,r.changeId!,author,date);
      if(np){parts[i]={t:'p',c:np};applied.push(r);pending[ri].done=true;}
    }
  }
  const cx=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${applied.map(r=>`<w:comment w:id="${r.commentId}" w:author="ReviewItNow" w:date="${date}" w:initials="RI"><w:p><w:pPr><w:pStyle w:val="CommentText"/></w:pPr><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:annotationRef/></w:r><w:r><w:t xml:space="preserve">${escXml('['+r.status+' · '+r.risk+'] '+r.clauseName+': '+r.comment)}</w:t></w:r></w:p></w:comment>`).join('')}</w:comments>`;
  zip.file("word/document.xml",parts.map(p=>p.c).join(''));zip.file("word/comments.xml",cx);
  let dr=await zip.file("word/_rels/document.xml.rels").async("string");
  if(!dr.includes('comments')){dr=dr.replace('</Relationships>','<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/></Relationships>');zip.file("word/_rels/document.xml.rels",dr);}
  let ct=await zip.file("[Content_Types].xml").async("string");
  if(!ct.includes('comments+xml')){ct=ct.replace('</Types>','<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml" PartName="/word/comments.xml"/></Types>');zip.file("[Content_Types].xml",ct);}
  return{blob:await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}),applied,notApplied:pending.filter(r=>!r.done)};
}

// ─── BADGES ───────────────────────────────────────────────────────────────────
function Pill({label,bg,color,border,size=11}:{label:string;bg:string;color:string;border:string;size?:number}){return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:4,border:`1px solid ${border}`,background:bg,color,fontSize:size,fontWeight:600,letterSpacing:"0.04em",fontFamily:"ui-monospace,'SF Mono',monospace",whiteSpace:"nowrap"}}>{label}</span>;}
function TypeBadge({type}:{type:string}){const m:Record<string,{bg:string;color:string;border:string}>={BUSINESS:{bg:C.greenLt,color:C.green,border:"#B8D9C4"},LEGAL:{bg:C.navyLt,color:C.navy,border:"#B8CCE0"},LINKAGE:{bg:C.amberLt,color:C.amber,border:"#E8C88A"},GREEN:{bg:C.lowBg,color:C.low,border:C.lowBorder},YELLOW:{bg:C.medBg,color:C.med,border:C.medBorder},RED:{bg:C.highBg,color:C.high,border:C.highBorder}};const s=m[type]||{bg:"#F5F5F3",color:C.textMid,border:C.border};return <Pill label={type} {...s}/>;}
function RiskBadge({risk}:{risk:string}){const m:Record<string,{bg:string;color:string;border:string}>={HIGH:{bg:C.highBg,color:C.high,border:C.highBorder},MEDIUM:{bg:C.medBg,color:C.med,border:C.medBorder},LOW:{bg:C.lowBg,color:C.low,border:C.lowBorder}};const s=m[risk]||{bg:"#F5F5F3",color:C.textMid,border:C.border};return <Pill label={risk} {...s}/>;}
function AgentBadge({agentId}:{agentId:string}){const a=AGENTS[agentId];if(!a)return null;return <Pill label={a.label} bg={a.light} color={a.color} border={a.border}/>;}

// ─── CONTRACT VIEWER ──────────────────────────────────────────────────────────
function ContractViewer({ paragraphs, clauseMap, activeClauseId, onParaClick, freeData }:{ paragraphs:Paragraph[]; clauseMap:Record<string,string>; activeClauseId:string|null; onParaClick:(id:string)=>void; freeData:FreeAnalysisData|null }) {
  const paraRefs = useRef<Record<string,HTMLDivElement|null>>({});
  useEffect(() => {
    if (activeClauseId && paraRefs.current[activeClauseId]) {
      paraRefs.current[activeClauseId]!.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }, [activeClauseId]);

  const getParaStatus = (paraId: string) => {
    for (const [issueName, mappedId] of Object.entries(clauseMap)) {
      if (mappedId === paraId) {
        const issue = freeData?.criticalIssues?.find(i=>i.name===issueName);
        return issue ? issue.risk : null;
      }
    }
    return null;
  };
  const statusBg = (r: string|null) => r==="HIGH"?C.highBg:r==="MEDIUM"?C.medBg:r==="LOW"?C.lowBg:"transparent";
  const statusBorder = (r: string|null) => r==="HIGH"?C.highBorder:r==="MEDIUM"?C.medBorder:r==="LOW"?C.lowBorder:"transparent";
  const statusDot = (r: string|null) => r==="HIGH"?C.high:r==="MEDIUM"?C.med:r==="LOW"?C.low:null;

  return (
    <div style={{height:"100%",overflowY:"auto",padding:"20px 24px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textSub,letterSpacing:"0.08em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:16,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
        CONTRACT — click highlighted clause to jump to analysis
      </div>
      {paragraphs.map(para => {
        const status = getParaStatus(para.id);
        const isActive = activeClauseId === para.id;
        const isLinked = status !== null;
        return (
          <div key={para.id} ref={el=>{paraRefs.current[para.id]=el}}
            onClick={() => isLinked && onParaClick(para.id)}
            style={{position:"relative",padding:para.isHeading?"10px 12px 5px":"5px 12px",marginBottom:para.isHeading?3:2,borderRadius:5,cursor:isLinked?"pointer":"default",background:isActive?(statusBg(status)||"#EBF0F6"):isLinked?statusBg(status):"transparent",border:`1px solid ${isActive?(statusBorder(status)||"#B8CCE0"):isLinked?statusBorder(status):"transparent"}`,transition:"all 0.15s",borderLeft:isLinked?`3px solid ${statusDot(status)||C.navy}`:"3px solid transparent"}}>
            {isLinked&&<div style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",width:6,height:6,borderRadius:"50%",background:statusDot(status)||C.navy,opacity:0.7}}/>}
            {para.isHeading
              ? <div style={{fontSize:para.headingLevel===0?15:para.headingLevel===1?13:12,fontWeight:700,color:isLinked?(status==="HIGH"?C.high:status==="MEDIUM"?C.med:status==="LOW"?C.low:C.navy):C.text,lineHeight:1.4}}>{para.text}</div>
              : <div style={{fontSize:12,color:C.text,lineHeight:1.7,fontFamily:"'Georgia',serif"}}>{para.runs.map((run,ri)=><span key={ri} style={{fontWeight:run.bold?600:400,fontStyle:run.italic?"italic":"normal"}}>{run.text}</span>)}</div>
            }
          </div>
        );
      })}
    </div>
  );
}

// ─── FREE RESULTS PANEL ───────────────────────────────────────────────────────
function FreeResultsPanel({ data, clauseMap, activeParaId, onIssueClick }:{ data:FreeAnalysisData; clauseMap:Record<string,string>; activeParaId:string|null; onIssueClick:(name:string,id:string)=>void }) {
  const recConfig:Record<string,{bg:string;color:string;border:string}> = {"SIGN AS-IS":{bg:C.lowBg,color:C.low,border:C.lowBorder},"SIGN WITH MODIFICATIONS":{bg:C.medBg,color:C.med,border:C.medBorder},"DO NOT SIGN":{bg:C.highBg,color:C.high,border:C.highBorder}};
  const rec = recConfig[data.recommendation||""]||recConfig["SIGN WITH MODIFICATIONS"];
  return (
    <div style={{height:"100%",overflowY:"auto",padding:"20px 24px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textSub,letterSpacing:"0.08em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:16,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
        ANALYSIS — click any issue to locate in contract
      </div>
      <div style={{padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"Type",v:data.documentType},{l:"Parties",v:data.parties},{l:"Jurisdiction",v:data.governingJurisdiction},{l:"Date",v:data.effectiveDate}].map(f=>(
            <div key={f.l}><div style={{fontSize:10,fontWeight:700,color:C.textSub,letterSpacing:"0.07em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:2}}>{f.l.toUpperCase()}</div><div style={{fontSize:12,color:C.text,fontWeight:500}}>{f.v||"\u2014"}</div></div>
          ))}
        </div>
      </div>
      {data.jurisdictionNote&&<div style={{display:"flex",gap:10,padding:"9px 12px",background:C.navyLt,border:`1px solid #B8CCE0`,borderRadius:8,marginBottom:12}}><span style={{fontSize:10,fontWeight:700,color:C.navy,fontFamily:"ui-monospace,'SF Mono',monospace",whiteSpace:"nowrap",marginTop:1}}>JX</span><span style={{fontSize:12,color:C.text,lineHeight:1.5}}>{data.jurisdictionNote}</span></div>}
      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:rec.bg,border:`1px solid ${rec.border}`,borderRadius:8,marginBottom:14}}>
        <Pill label={data.recommendation||""} bg={rec.bg} color={rec.color} border={rec.border} size={10}/>
        <span style={{fontSize:12,color:C.text,lineHeight:1.5,flex:1}}>{data.recommendationRationale}</span>
      </div>
      <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:"0.08em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:8}}>CRITICAL ISSUES — {data.criticalIssues?.length||0} found</div>
      {(data.criticalIssues||[]).map((issue,i)=>{
        const paraId=clauseMap[issue.name];
        const isActive=paraId&&activeParaId===paraId;
        const hasLink=!!paraId;
        const rBg=issue.risk==="HIGH"?C.highBg:issue.risk==="MEDIUM"?C.medBg:C.lowBg;
        const rBorder=issue.risk==="HIGH"?C.highBorder:issue.risk==="MEDIUM"?C.medBorder:C.lowBorder;
        const rColor=issue.risk==="HIGH"?C.high:issue.risk==="MEDIUM"?C.med:C.low;
        return (
          <div key={i} onClick={()=>hasLink&&onIssueClick(issue.name,paraId)}
            style={{padding:"10px 12px",background:isActive?rBg:C.surface,border:`1px solid ${isActive?rBorder:C.border}`,borderLeft:`3px solid ${rColor}`,borderRadius:8,marginBottom:6,cursor:hasLink?"pointer":"default",transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>{issue.name}</span>
              <TypeBadge type={issue.type}/>
              <RiskBadge risk={issue.risk}/>
              {hasLink&&<span style={{fontSize:10,color:isActive?rColor:C.textSub,fontFamily:"ui-monospace,'SF Mono',monospace",display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>{isActive?"viewing":"locate"}</span>}
            </div>
            <div style={{fontSize:12,color:C.textMid,lineHeight:1.5}}>{issue.summary}</div>
          </div>
        );
      })}
      {(data.crossoverFlags||[]).length>0&&(
        <div style={{marginTop:12}}>
          <div style={{fontSize:10,fontWeight:700,color:C.textSub,letterSpacing:"0.08em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:8}}>CROSSOVER FLAGS</div>
          {data.crossoverFlags!.map((flag,i)=>{const a=AGENTS[flag.agent];return<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",background:a?.light||C.navyLt,border:`1px solid ${a?.border||"#B8CCE0"}`,borderRadius:7,marginBottom:5}}><AgentBadge agentId={flag.agent}/><div style={{flex:1,marginLeft:4}}><span style={{fontSize:12,color:C.text,fontWeight:500}}>{flag.issue}</span><span style={{fontSize:11,color:C.textMid}}> — {flag.reason}</span></div></div>;})}
        </div>
      )}
    </div>
  );
}

// ─── ANALYSIS RENDERER ────────────────────────────────────────────────────────
function AnalysisRenderer({ text, agentId }:{ text:string; agentId:string }) {
  if (!text) return null;
  const agent = AGENTS[agentId];
  return <>{text.split("\n").map((line,i)=>{
    const raw=line.trim();
    if(!raw)return<div key={i} style={{height:5}}/>;
    if(/^PART [IVX]+:/i.test(raw)){const label=raw.replace(/^PART [IVX]+:\s*/i,"").toUpperCase();const isBiz=/BUSINESS/i.test(raw),isLink=/LINKAGE/i.test(raw)||/PLAYBOOK/i.test(raw),isLeg=/LEGAL/i.test(raw);const color=isBiz?C.green:isLink?C.amber:isLeg?C.navy:agent?.color||C.navy;return<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginTop:28,marginBottom:10,paddingBottom:8,borderBottom:`2px solid ${color}20`}}><div style={{width:3,height:18,borderRadius:2,background:color,flexShrink:0}}/><span style={{fontSize:11,fontWeight:700,color,letterSpacing:"0.06em",fontFamily:"ui-monospace,'SF Mono',monospace"}}>{label}</span></div>;}
    if(/^CLAUSE:/i.test(raw)){const name=raw.match(/^CLAUSE:\s*([^|]+)/i)?.[1]?.trim()||raw;const status=raw.match(/STATUS:\s*\[?(\w+)\]?/i)?.[1]?.toUpperCase();const type=raw.match(/TYPE:\s*\[?(\w+)\]?/i)?.[1]?.toUpperCase();const risk=raw.match(/RISK:\s*\[?(\w+)\]?/i)?.[1]?.toUpperCase();const lb:Record<string,string>={GREEN:C.lowBorder,YELLOW:C.medBorder,RED:C.highBorder};return<div key={i} style={{borderLeft:`3px solid ${(status&&lb[status])||C.border}`,paddingLeft:14,marginTop:18,marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{name}</span>{status&&<TypeBadge type={status}/>}{type&&<TypeBadge type={type}/>}{risk&&<RiskBadge risk={risk}/>}</div></div>;}
    if(/^LINKAGE:/i.test(raw)){const name=raw.match(/^LINKAGE:\s*([^|]+)/i)?.[1]?.trim()||"";const risk=raw.match(/RISK:\s*\[?(\w+)\]?/i)?.[1]?.toUpperCase();return<div key={i} style={{background:C.amberLt,border:`1px solid #E8C88A`,borderRadius:8,padding:"10px 14px",marginTop:14,marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:600,color:C.amber}}>{name}</span><TypeBadge type="LINKAGE"/>{risk&&<RiskBadge risk={risk}/>}</div></div>;}
    const fields=[{p:/^What it says:/i,l:"What it says",c:C.textMid,hi:false},{p:/^Standard position:/i,l:"Standard position",c:C.green,hi:false},{p:/^Deviation:/i,l:"Deviation",c:C.amber,hi:false},{p:/^Business impact:/i,l:"Business impact",c:C.textMid,hi:false},{p:/^Business decision:/i,l:"Business decision",c:C.green,hi:false},{p:/^Legal consequence:/i,l:"Legal consequence",c:C.amber,hi:true},{p:/^Recommendation:/i,l:"Recommendation",c:agent?.color||C.navy,hi:false}];
    const mf=fields.find(f=>f.p.test(raw));
    if(mf){const ci=raw.indexOf(":"),val=raw.slice(ci+1).trim();const ws:React.CSSProperties=mf.hi?{background:C.amberLt,border:`1px solid #E8C88A`,borderRadius:6,padding:"7px 12px",margin:"5px 0"}:{};return<div key={i} style={{display:"flex",gap:10,marginBottom:5,...ws}}><span style={{fontSize:11,fontWeight:700,color:mf.c,whiteSpace:"nowrap",fontFamily:"ui-monospace,'SF Mono',monospace",marginTop:2}}>{mf.l}:</span><span style={{fontSize:13,color:C.text,lineHeight:1.65}}>{val}</span></div>;}
    if(/^(?:Tier \d|Must-Have|Should-Have|Nice-to-Have|Strategy):/i.test(raw)){const ci=raw.indexOf(":"),lbl=raw.slice(0,ci),val=raw.slice(ci+1).trim();const color=/Tier 1|Must-Have/i.test(lbl)?C.high:/Tier 3|Nice-to-Have/i.test(lbl)?C.low:C.med;return<div key={i} style={{marginTop:12,marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color,letterSpacing:"0.05em",fontFamily:"ui-monospace,'SF Mono',monospace"}}>{lbl}</span>{val&&<span style={{fontSize:13,color:C.text,marginLeft:8}}>{val}</span>}</div>;}
    if(raw.startsWith("- ")||raw.startsWith("* "))return<div key={i} style={{display:"flex",gap:10,paddingLeft:4,marginBottom:3}}><span style={{color:C.textSub,fontSize:13,marginTop:2,flexShrink:0}}>&middot;</span><span style={{fontSize:13,color:C.text,lineHeight:1.65}}>{raw.slice(2)}</span></div>;
    if(/^={3,}$|^-{3,}$/.test(raw))return<hr key={i} style={{border:"none",borderTop:`1px solid ${C.border}`,margin:"10px 0"}}/>;
    return<p key={i} style={{fontSize:13,color:C.text,lineHeight:1.7,margin:"2px 0"}}>{raw}</p>;
  })}</>;
}

// ─── REDLINE TABLE ────────────────────────────────────────────────────────────
function RedlineTable({ redlines, notApplied=[] }:{ redlines:RedlineItem[]; notApplied?:RedlineItem[] }) {
  const [expanded, setExpanded] = useState<number|null>(null);
  return (
    <div style={{padding:"20px 24px",overflowY:"auto",height:"100%"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textSub,letterSpacing:"0.08em",fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:12}}>TRACKED CHANGES — {redlines.length} applied{notApplied.length>0?` \u00b7 ${notApplied.length} not located`:""}</div>
      {redlines.map((r,i)=>{const sBg=r.status==="RED"?C.highBg:r.status==="YELLOW"?C.medBg:C.lowBg;const sBorder=r.status==="RED"?C.highBorder:r.status==="YELLOW"?C.medBorder:C.lowBorder;const sColor=r.status==="RED"?C.high:r.status==="YELLOW"?C.med:C.low;return(<div key={i} style={{border:`1px solid ${sBorder}`,borderRadius:8,marginBottom:7,overflow:"hidden"}}><div onClick={()=>setExpanded(expanded===i?null:i)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:sBg,cursor:"pointer",flexWrap:"wrap"}}><Pill label={r.status} bg={sBg} color={sColor} border={sBorder}/><RiskBadge risk={r.risk}/><span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>{r.clauseName}</span><span style={{fontSize:11,color:C.textSub,fontFamily:"ui-monospace,'SF Mono',monospace"}}>{r.priority}</span><span style={{fontSize:12,color:C.textSub}}>{expanded===i?"\u25b2":"\u25bc"}</span></div>{expanded===i&&<div style={{padding:"12px 14px",background:C.surface,borderTop:`1px solid ${sBorder}`}}><div style={{marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:C.high,fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:4}}>DELETED</div><div style={{fontSize:12,color:C.textMid,fontFamily:"ui-monospace,'SF Mono',monospace",background:C.highBg,padding:"6px 10px",borderRadius:5,textDecoration:"line-through",lineHeight:1.6}}>{r.originalText}</div></div><div style={{marginBottom:10}}><div style={{fontSize:10,fontWeight:700,color:C.low,fontFamily:"ui-monospace,'SF Mono',monospace",marginBottom:4}}>INSERTED</div><div style={{fontSize:12,color:C.text,fontFamily:"ui-monospace,'SF Mono',monospace",background:C.lowBg,padding:"6px 10px",borderRadius:5,lineHeight:1.6}}>{r.replacementText}</div></div><div style={{fontSize:12,color:C.textMid,lineHeight:1.6,padding:"8px 10px",background:"#F5F5F3",borderRadius:5}}><strong>Note:</strong> {r.comment}</div></div>}</div>);})}
      {notApplied.length>0&&<div style={{padding:"10px 14px",background:C.medBg,border:`1px solid ${C.medBorder}`,borderRadius:8,marginTop:6}}><div style={{fontSize:12,fontWeight:600,color:C.med,marginBottom:3}}>Not located in document</div><div style={{fontSize:12,color:C.textMid}}>{notApplied.map(r=>r.clauseName).join(", ")} — shown in analysis.</div></div>}
    </div>
  );
}

// ─── PAYWALL GATE ─────────────────────────────────────────────────────────────
function PaywallGate({ tier, price, title, features, onUnlock, loading }:{ tier:string; price:number; title:string; features:string[]; onUnlock:(t:string)=>void; loading:boolean }) {
  const isRedline=tier==="redline";
  const ac=isRedline?C.navy:C.green, al=isRedline?C.navyLt:C.greenLt, ab=isRedline?"#B8CCE0":"#B8D9C4";
  return (
    <div style={{border:`2px solid ${ab}`,borderRadius:12,overflow:"hidden",margin:"20px 24px"}}>
      <div style={{background:al,borderBottom:`1px solid ${ab}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:14,fontWeight:700,color:ac,marginBottom:2}}>{title}</div><div style={{fontSize:12,color:C.textMid}}>One-time charge for this document</div></div>
        <div style={{display:"flex",alignItems:"baseline",gap:3}}><span style={{fontSize:26,fontWeight:700,color:ac}}>${price}</span><span style={{fontSize:12,color:C.textSub}}>/doc</span></div>
      </div>
      <div style={{padding:"14px 18px",background:C.surface}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
          {features.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:7}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0,marginTop:1}}><path d="M2 7l4 4 6-6" stroke={ac} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{fontSize:12,color:C.text,lineHeight:1.4}}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>onUnlock(tier)} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:8,background:loading?C.border:ac,border:"none",color:loading?C.textSub:"#FFFFFF",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"rgba(255,255,255,0.9)",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> Processing...</>:<><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="5" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.2"/><path d="M4 5V3.5a3 3 0 016 0V5" stroke="white" strokeWidth="1.2"/></svg> Unlock for ${price}</>}
        </button>
        <div style={{textAlign:"center",marginTop:7,fontSize:11,color:C.textSub}}>Secure payment via Stripe</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ReviewItNow() {
  const [screen, setScreen] = useState("landing");
  const [activeAgent, setActiveAgent] = useState("contract");
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer|null>(null);
  const [pdfFile, setPdfFile] = useState<string|null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<string|null>(null);
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState("upload");
  const [role, setRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [dealContext, setDealContext] = useState("");
  const [usePlaybook, setUsePlaybook] = useState(false);
  const [playbook, setPlaybook] = useState(DEFAULT_PLAYBOOK);
  const [jurisdiction, setJurisdiction] = useState("Auto-detect");
  const [dragOver, setDragOver] = useState(false);

  const [playbookSaved, setPlaybookSaved] = useState(false);
  const [playbookLastSaved, setPlaybookLastSaved] = useState<string|null>(null);

  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [clauseMap, setClauseMap] = useState<Record<string,string>>({});
  const [activeClauseParaId, setActiveClauseParaId] = useState<string|null>(null);

  const [freeData, setFreeData] = useState<FreeAnalysisData|null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [redlines, setRedlines] = useState<RedlineItem[]>([]);
  const [notApplied, setNotApplied] = useState<RedlineItem[]>([]);
  const [redlinedBlob, setRedlinedBlob] = useState<Blob|null>(null);
  const [contractText, setContractText] = useState("");

  const [tier, setTier] = useState("free");
  const [paymentLoading, setPaymentLoading] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [error, setError] = useState("");
  const [jsZipLoaded, setJsZipLoaded] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const agent = AGENTS[activeAgent];

  // ── Load JSZip ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.JSZip) { setJsZipLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.onload = () => setJsZipLoaded(true);
    document.head.appendChild(s);
  }, []);

  // ── Auto-load saved playbook on mount ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(PLAYBOOK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const { text, savedAt } = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        if (text) {
          setPlaybook(text);
          setUsePlaybook(true);
          setPlaybookLastSaved(savedAt);
        }
      }
    } catch(e) {}
  }, []);

  // ── Save playbook handler ────────────────────────────────────────────────────
  const savePlaybook = () => {
    try {
      const savedAt = new Date().toLocaleString("en-US", {
        month:"short", day:"numeric",
        hour:"numeric", minute:"2-digit"
      });
      localStorage.setItem(PLAYBOOK_KEY, JSON.stringify({ text: playbook, savedAt }));
      setPlaybookLastSaved(savedAt);
      setPlaybookSaved(true);
      setTimeout(() => setPlaybookSaved(false), 2500);
    } catch(e) { console.warn("Playbook save failed:", e); }
  };

  // ── Clear saved playbook ──────────────────────────────────────────────────────
  const clearPlaybook = () => {
    try {
      localStorage.removeItem(PLAYBOOK_KEY);
      setPlaybook(DEFAULT_PLAYBOOK);
      setPlaybookLastSaved(null);
      setPlaybookSaved(false);
    } catch(e) {}
  };

  // ── Upload playbook from file (.docx / .txt / .md) ───────────────────────────
  const [playbookFileName, setPlaybookFileName] = useState<string|null>(null);
  const [playbookMode, setPlaybookMode] = useState<"upload"|"paste">("paste");
  const [playbookDragOver, setPlaybookDragOver] = useState(false);
  const uploadPlaybookFile = async (file: File) => {
    if (!file || typeof window === 'undefined') return;
    const name = file.name.toLowerCase();
    const isDocx = name.endsWith(".docx") || file.type.includes("wordprocessingml");
    const isText = name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/");
    if (!isDocx && !isText) { setError("Playbook must be .docx, .txt, or .md"); return; }
    setError("");
    try {
      let text = "";
      if (isDocx) {
        const buf = await file.arrayBuffer();
        const JSZip = window.JSZip || await new Promise<any>(r=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";s.onload=()=>{setJsZipLoaded(true);r(window.JSZip);};document.head.appendChild(s);});
        const zip = await JSZip.loadAsync(buf);
        const xml = await zip.file("word/document.xml").async("string");
        text = xml.replace(/<w:p[^>]*>/g,"\n").replace(/<[^>]+>/g,"").replace(/\s+\n/g,"\n").trim();
      } else {
        text = await file.text();
      }
      if (!text.trim()) { setError("Could not extract text from playbook file."); return; }
      setPlaybook(text);
      setPlaybookFileName(file.name);
      setPlaybookSaved(false);
      setUsePlaybook(true);
    } catch(e: any) {
      setError("Playbook upload failed: " + (e?.message || "unknown error"));
    }
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    if (typeof window === 'undefined') return;
    const isDocx = file.name?.endsWith(".docx")||file.type?.includes("wordprocessingml");
    const isPdf = file.type==="application/pdf";
    if (!isDocx&&!isPdf) { setError("Please upload a DOCX or PDF file."); return; }
    setFileName(file.name); setError("");
    const reader = new FileReader();
    if (isDocx) {
      setFileType("docx");
      reader.onload = async e => {
        const buf = e.target?.result as ArrayBuffer;
        setDocxBuffer(buf);
        try {
          const JSZip = window.JSZip || await new Promise<any>(r=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";s.onload=()=>{setJsZipLoaded(true);r(window.JSZip);};document.head.appendChild(s);});
          const zip = await JSZip.loadAsync(buf);
          const xml = await zip.file("word/document.xml").async("string");
          setParagraphs(parseDocxStructure(xml));
        } catch(e) { console.warn("DOCX parse failed:", e); }
        setScreen("review");
        setTimeout(()=>reviewRef.current?.scrollIntoView({behavior:"smooth"}),100);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFileType("pdf");
      reader.onload = e => { setPdfFile((e.target?.result as string).split(",")[1]); setScreen("review"); setTimeout(()=>reviewRef.current?.scrollIntoView({behavior:"smooth"}),100); };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent)=>{e.preventDefault();setDragOver(false);const files = e.dataTransfer.files; if(files[0]) processFile(files[0]);}, [processFile]);
  const toggleFocus = (area: string) => setFocusAreas(p=>{if(area==="All clauses"||area==="All issues")return p.includes(area)?[]:[area];const f=p.filter(a=>a!=="All clauses"&&a!=="All issues");return p.includes(area)?f:[...f,area];});

  const buildContext = () => [
    role&&`Role: ${role}`,
    deadline&&`Deadline: ${deadline}`,
    focusAreas.length>0&&`Focus: ${focusAreas.join(", ")}`,
    dealContext&&`Context: ${dealContext}`,
    jurisdiction!=="Auto-detect"&&`Jurisdiction: ${jurisdiction} — apply all applicable ${jurisdiction} law`,
    usePlaybook&&playbook.trim()&&`CUSTOM PLAYBOOK — review every clause against these positions and flag all deviations:\n${playbook}`,
    !usePlaybook&&`Review basis: widely-accepted commercial market standards.`,
  ].filter(Boolean).join("\n");

  const extractDocxText = async () => {
    if (typeof window === 'undefined') return pastedText;
    if (!docxBuffer) return pastedText;
    try {
      const zip = await window.JSZip.loadAsync(docxBuffer);
      const xml = await zip.file("word/document.xml").async("string");
      return unescXml((xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)||[]).map((m: string)=>m.replace(/<w:t[^>]*>/,'').replace(/<\/w:t>/,'')).join(' ')).replace(/\s+/g,' ').trim();
    } catch(e) { return pastedText; }
  };

  const getContent = (text: string): any[] => {
    if (fileType==="pdf"&&pdfFile) return [{type:"document",source:{type:"base64",media_type:"application/pdf",data:pdfFile}}];
    return [{type:"text",text:`---CONTRACT---\n\n${text}`}];
  };

  const callAPI = async (system: string, userContent: any[], maxTokens = 2000) => {
    const res = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: userContent }], maxTokens }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "API error"); }
    return (await res.json()).content?.map((b: any) => b.text || "").join("") || "";
  };

  const parseJson = (raw: string) => {
    try { return JSON.parse(raw.replace(/```json\n?|\n?```/g,"").trim()); }
    catch(e) { const m=raw.match(/[\[{][\s\S]*[\]}]/); if(m) try { return JSON.parse(m[0]); } catch(e2) {} return null; }
  };

  const runFreeAnalysis = async () => {
    const hasContent=(fileType==="docx"&&docxBuffer)||(fileType==="pdf"&&pdfFile)||pastedText.trim();
    if (!hasContent) { setError("Please upload a document or paste text."); return; }
    setLoading(true); setError(""); setFreeData(null); setAnalysisText(""); setRedlines([]); setRedlinedBlob(null); setTier("free"); setClauseMap({});
    try {
      setLoadingStage("Reviewing contract...");
      const cText = await extractDocxText();
      setContractText(cText);
      if (!paragraphs.length && cText) {
        const synth = cText.split(/\n+/).filter((t: string)=>t.trim()).map((text: string,i: number)=>({id:`p_${i}`,style:"Normal",text,runs:[{text,bold:false,italic:false}],isHeading:/^(\d+\.|[IVX]+\.)\s/.test(text)||text.length<60,headingLevel:null}));
        setParagraphs(synth);
      }
      const ctx = buildContext();
      const raw = await callAPI(FREE_SYSTEM, [...getContent(cText), {type:"text",text:`${ctx}\n\nAnalyze this contract and return the JSON object.`}], 2000);
      const parsed = parseJson(raw);
      if (!parsed) throw new Error("Could not parse response.");
      setFreeData(parsed);
      const map: Record<string,string> = {};
      for (const issue of (parsed.criticalIssues||[])) {
        const id = matchClauseToParaId(issue.name, issue.sourceKeywords, paragraphs);
        if (id) map[issue.name] = id;
      }
      setClauseMap(map);
      setTier("free"); setActiveView("dashboard"); setScreen("output");
      setTimeout(()=>outputRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch(err: any) { setError(`Analysis failed: ${err.message}`); }
    finally { setLoading(false); setLoadingStage(""); }
  };

  const handlePayment = async (targetTier: string) => {
    setPaymentLoading(targetTier);
    setLoading(true);
    setError("");
    try {
      await unlockTier(targetTier);
    } catch (err: any) {
      setError(err?.message || "Unlock failed. Please try again.");
    } finally {
      setPaymentLoading(null);
      setLoading(false);
    }
  };

  const unlockTier = async (targetTier: string) => {
    const ctx = buildContext();
    const content = [...getContent(contractText), {type:"text",text:`${ctx}\n\nAnalyze this contract.`}];
    if (targetTier==="analyze"||targetTier==="redline") {
      setLoadingStage("Generating full analysis...");
      const aRaw = await callAPI(ANALYZE_SYSTEM, content, 4000);
      setAnalysisText(aRaw); setTier("analyze"); setActiveView("analysis");
    }
    if (targetTier==="redline") {
      setLoadingStage("Generating redlines...");
      const rRaw = await callAPI(REDLINE_SYSTEM, content, 3000);
      const rList = Array.isArray(parseJson(rRaw)) ? parseJson(rRaw) : [];
      if (fileType==="docx"&&docxBuffer&&jsZipLoaded&&rList.length>0) {
        setLoadingStage("Applying tracked changes...");
        const {blob,applied,notApplied:na} = await applyRedlinesToDocx(docxBuffer, rList);
        setRedlinedBlob(blob); setRedlines(applied); setNotApplied(na); setActiveView("redlines");
      } else { setRedlines(rList); setActiveView("analysis"); }
      setTier("redline");
    }
    setLoadingStage("");
  };

  const handleIssueClick = (issueName: string, paraId: string) => { setActiveClauseParaId(paraId); };
  const handleParaClick = (paraId: string) => { setActiveClauseParaId(paraId); };

  const downloadRedlined = () => {
    if (typeof window === 'undefined' || !redlinedBlob) return;
    const url=URL.createObjectURL(redlinedBlob);
    const a=document.createElement("a");
    a.href=url; a.download=`ReviewItNow_Redlined_${fileName||"contract"}_${new Date().toISOString().slice(0,10)}.docx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const reset = () => { setScreen("landing");setFreeData(null);setAnalysisText("");setRedlines([]);setNotApplied([]);setRedlinedBlob(null);setDocxBuffer(null);setPdfFile(null);setFileName("");setTier("free");setContractText("");setParagraphs([]);setClauseMap({});setActiveClauseParaId(null);setActiveView("dashboard");setError(""); };

  const inp:React.CSSProperties={background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"9px 12px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.15s",fontFamily:"inherit"};

  const tierBadge = () => {
    if(tier==="redline")return<Pill label="REDLINE" bg={C.navyLt} color={C.navy} border="#B8CCE0"/>;
    if(tier==="analyze")return<Pill label="ANALYZE" bg={C.greenLt} color={C.green} border="#B8D9C4"/>;
    return<Pill label="FREE" bg="#F5F5F3" color={C.textMid} border={C.border}/>;
  };

  const showViewer = paragraphs.length > 0 && screen==="output";

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.borderMid};border-radius:4px}
    input::placeholder,textarea::placeholder{color:${C.textSub}}
    select option{color:${C.text};background:${C.surface}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  `;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",color:C.text}}>
      <style>{css}</style>

      {/* NAV */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:showViewer?"100%":"960px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:50}}>
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={reset}>
            <div style={{width:24,height:24,borderRadius:6,background:agent.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L2.5 4.2v3.8c0 2.3 2 4.2 4.5 4.6 2.5-.4 4.5-2.3 4.5-4.6V4.2L7 1.5z" stroke="white" strokeWidth="1.3" fill="none"/></svg>
            </div>
            <span style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:"-0.02em"}}>ReviewItNow</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            {screen==="output"&&freeData&&(
              <>
                {tierBadge()}
                <div style={{width:1,height:16,background:C.border,margin:"0 3px"}}/>
                {[{id:"dashboard",label:"Dashboard"}, ...(tier!=="free"?[{id:"analysis",label:"Full analysis"}]:[]), ...(tier==="redline"&&redlines.length>0?[{id:"redlines",label:`Tracked (${redlines.length})`}]:[])].map(t=>(
                  <button key={t.id} onClick={()=>setActiveView(t.id)} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${activeView===t.id?agent.color:C.border}`,background:activeView===t.id?agent.light:"transparent",color:activeView===t.id?agent.color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{t.label}</button>
                ))}
                <div style={{width:1,height:16,background:C.border,margin:"0 2px"}}/>
              </>
            )}
            {redlinedBlob&&<button onClick={downloadRedlined} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,border:`1.5px solid ${C.navy}`,background:C.navy,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4 6l3 4 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 11h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>Download</button>}
            {screen!=="landing"&&<button onClick={reset} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${C.border}`,background:"transparent",color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer"}}>New review</button>}
            <div style={{display:"flex",gap:2}}>
              {Object.values(AGENTS).map(a=>(
                <button key={a.id} onClick={()=>setActiveAgent(a.id)} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${activeAgent===a.id?a.color:C.border}`,background:activeAgent===a.id?a.light:"transparent",color:activeAgent===a.id?a.color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LANDING */}
      {screen==="landing"&&(
        <div style={{animation:"fadeUp 0.3s ease"}}>
          <div style={{maxWidth:620,margin:"0 auto",padding:"60px 28px 40px",textAlign:"center"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:20,border:`1px solid ${C.border}`,background:C.surface,fontSize:12,color:C.textMid,marginBottom:18,fontWeight:500}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>
              Free &middot; $29 full review &middot; $99 redlined DOCX — ReviewItNow.ai
            </div>
            <h1 style={{fontSize:36,fontWeight:700,color:C.text,letterSpacing:"-0.03em",lineHeight:1.15,marginBottom:12}}>
              Upload your contract.<br/><span style={{color:agent.color}}>Know your risks.</span>
            </h1>
            <p style={{fontSize:14,color:C.textMid,lineHeight:1.6,maxWidth:420,margin:"0 auto 28px"}}>
              ReviewItNow flags every risk, free. Pay $29 to see exactly what&apos;s wrong. Pay $99 to get your contract back with tracked changes ready to send.
            </p>
            <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:20}}>
              {Object.values(AGENTS).map(a=>(
                <button key={a.id} onClick={()=>setActiveAgent(a.id)} style={{padding:"6px 14px",borderRadius:7,border:`1.5px solid ${activeAgent===a.id?a.color:C.border}`,background:activeAgent===a.id?a.light:"transparent",color:activeAgent===a.id?a.color:C.textMid,fontSize:12,fontWeight:activeAgent===a.id?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                  {a.label}<div style={{fontSize:10,color:activeAgent===a.id?a.color:C.textSub,marginTop:1,fontWeight:400}}>{a.desc}</div>
                </button>
              ))}
            </div>
            <div onDragOver={(e: React.DragEvent)=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop}
              onClick={()=>inputMode==="upload"&&fileRef.current?.click()}
              style={{background:dragOver?agent.light:C.surface,border:`2px dashed ${dragOver?agent.color:C.borderMid}`,borderRadius:14,padding:inputMode==="upload"?"36px 24px":"18px 24px",cursor:inputMode==="upload"?"pointer":"default",transition:"all 0.2s"}}>
              <input ref={fileRef} type="file" accept=".docx,.pdf" style={{display:"none"}} onChange={e=>{const files=e.target.files; if(files?.[0]) processFile(files[0]);}}/>
              <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:14}}>
                {[{id:"upload",label:"Upload file"},{id:"paste",label:"Paste text"}].map(m=>(
                  <button key={m.id} onClick={(e: React.MouseEvent)=>{e.stopPropagation();setInputMode(m.id);}} style={{padding:"4px 12px",borderRadius:5,border:`1px solid ${inputMode===m.id?agent.color:C.border}`,background:inputMode===m.id?agent.light:"transparent",color:inputMode===m.id?agent.color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{m.label}</button>
                ))}
              </div>
              {inputMode==="upload"?(
                <div style={{animation:"float 3s ease-in-out infinite"}}>
                  <div style={{width:48,height:48,borderRadius:12,background:agent.light,border:`1px solid ${agent.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4L8 8h3v10h2V8h3L12 4z" fill={agent.color}/><path d="M4 18v2h16v-2" stroke={agent.color} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:3}}>Drop your contract here</div>
                  <div style={{fontSize:12,color:C.textSub}}>DOCX &middot; PDF &middot; Free to analyze</div>
                </div>
              ):(
                <div onClick={(e: React.MouseEvent)=>e.stopPropagation()}>
                  <textarea value={pastedText} onChange={e=>setPastedText(e.target.value)} placeholder="Paste the full text of your agreement here..." style={{...inp,minHeight:120,resize:"vertical",lineHeight:1.7,fontSize:13,border:"none",padding:0,background:"transparent"}}/>
                  {pastedText.trim()&&<button onClick={()=>setScreen("review")} style={{width:"100%",padding:"10px",borderRadius:7,background:agent.color,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:10}}>Continue</button>}
                </div>
              )}
            </div>
            {error&&<div style={{padding:"10px 14px",background:C.highBg,border:`1px solid ${C.highBorder}`,borderRadius:8,color:C.high,fontSize:13,marginTop:10}}>{error}</div>}
          </div>

          {/* Tier ladder */}
          <div style={{borderTop:`1px solid ${C.border}`,background:C.surface,padding:"20px 28px"}}>
            <div style={{maxWidth:620,margin:"0 auto"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>What you get at each level</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[
                  {label:"Free",price:"$0",color:C.textMid,features:["Critical issues dashboard","Side-by-side contract viewer","Click to locate clauses","Overall recommendation"],highlight:false},
                  {label:"Analyze",price:"$29",color:C.green,features:["Everything in Free","Full clause-by-clause analysis","Business/Legal/Linkage map","Negotiation playbook"],highlight:false},
                  {label:"Redline",price:"$99",color:C.navy,features:["Everything in Analyze","Tracked changes in DOCX","Comment bubbles on every change","Ready to send to counterparty"],highlight:true},
                ].map(t=>(
                  <div key={t.label} style={{padding:"12px",border:`${t.highlight?"2px":"1px"} solid ${t.highlight?"#B8CCE0":C.border}`,borderRadius:9,background:t.highlight?C.navyLt:C.bg}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:t.color}}>{t.label}</span><span style={{fontSize:12,color:C.textSub}}>{t.price}</span></div>
                    {t.features.map((f,fi)=>(
                      <div key={fi} style={{display:"flex",alignItems:"flex-start",gap:5,marginBottom:4}}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,marginTop:1}}><path d="M2 6l3 3 5-5" stroke={t.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{fontSize:11,color:C.textMid,lineHeight:1.4}}>{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {screen==="review"&&(
        <div ref={reviewRef} style={{animation:"fadeUp 0.25s ease",maxWidth:580,margin:"0 auto",padding:"28px 24px"}}>
          {fileName&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:agent.light,border:`1px solid ${agent.border}`,borderRadius:9,marginBottom:16}}>
              <div style={{width:30,height:30,borderRadius:6,background:C.surface,border:`1px solid ${agent.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="9" height="13" rx="1.5" stroke={agent.color} strokeWidth="1.2"/><path d="M8 1v4h5" stroke={agent.color} strokeWidth="1.2"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:agent.color}}>{fileName}</div>
                <div style={{fontSize:11,color:C.textMid}}>{fileType==="docx"&&jsZipLoaded?"DOCX \u00b7 split-screen viewer + redline available":"PDF \u00b7 analysis report"}</div>
              </div>
              <button onClick={()=>{setDocxBuffer(null);setPdfFile(null);setFileName("");setScreen("landing");}} style={{fontSize:10,color:C.textSub,background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Change</button>
            </div>
          )}

          {playbookLastSaved&&usePlaybook&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:C.greenLt,border:`1px solid #B8D9C4`,borderRadius:7,marginBottom:14}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{fontSize:11,color:C.green,fontWeight:500}}>Your saved playbook loaded — last saved {playbookLastSaved}</span>
            </div>
          )}

          <div style={{fontSize:17,fontWeight:700,color:C.text,letterSpacing:"-0.02em",marginBottom:3}}>Quick context</div>
          <div style={{fontSize:12,color:C.textMid,marginBottom:16}}>30 seconds. Makes every tier more accurate.</div>

          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:C.text,marginBottom:7}}>Which side are you on? <span style={{color:C.high}}>*</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {ROLES[activeAgent].map(r=>(
                <button key={r} onClick={()=>setRole(p=>p===r?"":r)} style={{padding:"5px 12px",borderRadius:6,border:`1.5px solid ${role===r?agent.color:C.border}`,background:role===r?agent.light:"transparent",color:role===r?agent.color:C.textMid,fontSize:12,fontWeight:role===r?600:400,cursor:"pointer",transition:"all 0.15s"}}>{r}</button>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.text,marginBottom:5}}>Deadline <span style={{fontSize:10,fontWeight:400,color:C.textSub}}>(optional)</span></label><input value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="e.g. End of week" style={inp}/></div>
            <div><label style={{display:"block",fontSize:11,fontWeight:600,color:C.text,marginBottom:5}}>Jurisdiction <span style={{fontSize:10,fontWeight:400,color:C.textSub}}>(optional)</span></label><select value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} style={inp}>{JURISDICTIONS.map(j=><option key={j} value={j}>{j}</option>)}</select></div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.text,marginBottom:7}}>Focus areas <span style={{fontSize:10,fontWeight:400,color:C.textSub}}>(optional)</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {FOCUS_AREAS[activeAgent].map(area=>(
                <button key={area} onClick={()=>toggleFocus(area)} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${focusAreas.includes(area)?agent.color:C.border}`,background:focusAreas.includes(area)?agent.light:"transparent",color:focusAreas.includes(area)?agent.color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{area}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,color:C.text,marginBottom:5}}>Context <span style={{fontSize:10,fontWeight:400,color:C.textSub}}>(optional)</span></label>
            <textarea value={dealContext} onChange={e=>setDealContext(e.target.value)} placeholder="e.g. $2M SaaS deal, renewal negotiation..." style={{...inp,minHeight:52,resize:"vertical",lineHeight:1.6,fontSize:12}}/>
          </div>

          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
              <button
                onClick={()=>setUsePlaybook(p=>!p)}
                style={{width:17,height:17,borderRadius:3,border:`1.5px solid ${usePlaybook?agent.color:C.borderMid}`,background:usePlaybook?agent.color:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                {usePlaybook&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2 2 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text}}>Use my standard positions</div>
                  {playbookLastSaved&&<Pill label="Saved" bg={C.lowBg} color={C.low} border={C.lowBorder} size={10}/>}
                </div>
                <div style={{fontSize:11,color:C.textMid,marginTop:1}}>Review against your playbook, not generic market practice.</div>
              </div>
            </div>

            {usePlaybook&&(
              <div style={{marginTop:10}}>
                <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:10}}>
                  {[{id:"upload",label:"Upload file"},{id:"paste",label:"Paste text"}].map(m=>(
                    <button key={m.id} onClick={()=>setPlaybookMode(m.id as "upload"|"paste")} style={{padding:"5px 14px",borderRadius:999,border:`1px solid ${playbookMode===m.id?agent.color:C.border}`,background:playbookMode===m.id?agent.light:"transparent",color:playbookMode===m.id?agent.color:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s"}}>{m.label}</button>
                  ))}
                </div>

                {playbookMode==="upload"?(
                  <label
                    onDragOver={(e: React.DragEvent)=>{e.preventDefault();setPlaybookDragOver(true);}}
                    onDragLeave={()=>setPlaybookDragOver(false)}
                    onDrop={(e: React.DragEvent)=>{e.preventDefault();setPlaybookDragOver(false);const f=e.dataTransfer.files?.[0]; if(f) uploadPlaybookFile(f);}}
                    style={{display:"block",background:playbookDragOver?agent.light:C.bg,border:`2px dashed ${playbookDragOver?agent.color:C.borderMid}`,borderRadius:12,padding:"20px 16px",cursor:"pointer",transition:"all 0.2s",textAlign:"center"}}>
                    <input type="file" accept=".docx,.txt,.md,text/plain,text/markdown" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0]; if(f) uploadPlaybookFile(f); e.target.value="";}}/>
                    <div style={{width:36,height:36,borderRadius:10,background:agent.light,border:`1px solid ${agent.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4L8 8h3v10h2V8h3L12 4z" fill={agent.color}/><path d="M4 18v2h16v-2" stroke={agent.color} strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:2}}>
                      {playbookFileName ? playbookFileName : "Drop your playbook here"}
                    </div>
                    <div style={{fontSize:11,color:C.textSub}}>DOCX &middot; TXT &middot; MD</div>
                  </label>
                ):(
                  <textarea
                    value={playbook}
                    onChange={e=>{ setPlaybook(e.target.value); setPlaybookSaved(false); setPlaybookFileName(null); }}
                    placeholder={PLAYBOOK_PLACEHOLDER}
                    style={{...inp,minHeight:90,resize:"vertical",lineHeight:1.7,fontSize:11,fontFamily:"ui-monospace,'SF Mono',monospace"}}
                  />
                )}

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7}}>
                  <span style={{fontSize:11,color:C.textSub}}>
                    {playbookFileName ? `Loaded from ${playbookFileName}` : playbookLastSaved ? `Last saved ${playbookLastSaved}` : "One position per line \u00b7 Not yet saved"}
                  </span>
                  <div style={{display:"flex",gap:6}}>
                    {(playbookLastSaved||playbookFileName)&&(
                      <button onClick={()=>{clearPlaybook();setPlaybookFileName(null);}} style={{padding:"3px 10px",borderRadius:999,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,fontSize:11,cursor:"pointer"}}>
                        Clear
                      </button>
                    )}
                    <button
                      onClick={savePlaybook}
                      style={{padding:"4px 14px",borderRadius:999,border:`1px solid ${playbookSaved?C.lowBorder:C.borderMid}`,background:playbookSaved?C.lowBg:"transparent",color:playbookSaved?C.low:C.textMid,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:5}}>
                      {playbookSaved
                        ?<><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Saved</>
                        :"Save playbook"
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error&&<div style={{padding:"9px 12px",background:C.highBg,border:`1px solid ${C.highBorder}`,borderRadius:7,color:C.high,fontSize:12,marginBottom:10}}>{error}</div>}

          <button onClick={runFreeAnalysis} disabled={!role||loading}
            style={{width:"100%",padding:"12px",borderRadius:8,background:!role||loading?C.border:agent.color,border:"none",color:!role||loading?C.textSub:"#FFFFFF",fontSize:14,fontWeight:600,cursor:!role||loading?"not-allowed":"pointer",transition:"all 0.2s"}}>
            {loading
              ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"rgba(255,255,255,0.9)",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/><span style={{animation:"pulse 1.5s ease-in-out infinite"}}>{loadingStage||"Analyzing..."}</span></span>
              :!role?"Select your role to continue":"Analyze free"
            }
          </button>
          <div style={{textAlign:"center",marginTop:7,fontSize:11,color:C.textSub}}>Free &middot; No credit card required</div>
        </div>
      )}

      {/* OUTPUT — SPLIT SCREEN */}
      {screen==="output"&&freeData&&(
        <div ref={outputRef} style={{animation:"fadeUp 0.25s ease",display:"flex",height:"calc(100vh - 50px)",overflow:"hidden"}}>
          {showViewer&&(
            <div style={{width:"42%",minWidth:300,borderRight:`1px solid ${C.border}`,background:C.surface,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <ContractViewer paragraphs={paragraphs} clauseMap={clauseMap} activeClauseId={activeClauseParaId} onParaClick={handleParaClick} freeData={freeData}/>
            </div>
          )}

          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
            {loadingStage&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",flex:1}}>
                <div style={{textAlign:"center"}}>
                  <div style={{width:36,height:36,border:`3px solid ${agent.light}`,borderTopColor:agent.color,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/>
                  <div style={{fontSize:14,fontWeight:600,color:C.text}}>{loadingStage}</div>
                </div>
              </div>
            )}
            {!loadingStage&&(
              <div style={{flex:1,overflowY:"auto"}}>
                {activeView==="dashboard"&&(
                  <>
                    <FreeResultsPanel data={freeData} clauseMap={clauseMap} activeParaId={activeClauseParaId} onIssueClick={handleIssueClick}/>
                    {tier==="free"&&(
                      <>
                        <PaywallGate tier="analyze" price={29} title="Full analysis \u2014 see exactly what's wrong"
                          features={["Clause-by-clause review with GREEN/YELLOW/RED","Business vs. Legal vs. Linkage classification","Market standard comparisons for every clause","Negotiation playbook with Tier 1/2/3 priorities"]}
                          onUnlock={handlePayment} loading={paymentLoading==="analyze"}/>
                        <PaywallGate tier="redline" price={99} title="Redlined DOCX \u2014 tracked changes ready to send"
                          features={["Everything in the $29 analysis","Your DOCX with tracked changes injected","Comment bubbles on every change","Ready to send to the other side"]}
                          onUnlock={handlePayment} loading={paymentLoading==="redline"}/>
                        <div style={{height:20}}/>
                      </>
                    )}
                  </>
                )}
                {activeView==="analysis"&&analysisText&&(
                  <>
                    <div style={{padding:"20px 24px"}}>
                      <AnalysisRenderer text={analysisText} agentId={activeAgent}/>
                    </div>
                    {tier==="analyze"&&(
                      <PaywallGate tier="redline" price={99} title="Get the redlined DOCX"
                        features={["Your DOCX returned with tracked changes","Deleted text struck through \u00b7 New text underlined","Comment bubbles explaining every change","Ready to send directly to the counterparty"]}
                        onUnlock={handlePayment} loading={paymentLoading==="redline"}/>
                    )}
                    <div style={{height:20}}/>
                  </>
                )}
                {activeView==="redlines"&&<RedlineTable redlines={redlines} notApplied={notApplied}/>}
                <div style={{padding:"12px 24px 20px",borderTop:`1px solid ${C.border}`}}>
                  <p style={{fontSize:10,color:C.textSub,lineHeight:1.6}}>ReviewItNow AI-generated analysis. Does not constitute legal advice or create an attorney-client relationship. Review with qualified licensed counsel before executing any agreement.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
