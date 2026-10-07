// Contenuti di default del sito. Tutto ciò che è qui è modificabile dal pannello /admin → "Contenuti sito".
module.exports = {
  brand: {
    name: 'EasyEnglish',
    tagline: "L'inglese che ti sta semplice.",
    email: 'ciao@easyenglish.demo',
    phone: '+39 346 788 5300',
    address: 'Roma · lezioni in presenza',
    hours: 'Lun–Ven 9:00–20:00 · Sab 9:00–13:00'
  },
  hero: {
    kicker: 'Corsi di inglese a Roma e online in tutta Italia',
    title: "Parla inglese. Senza stress. Senza spendere una fortuna.",
    subtitle: "Lezioni individuali e di gruppo per bambini, adulti e aziende. Insegnanti qualificati, prezzi chiari, primo incontro gratuito.",
    cta: 'Prenota la lezione di prova',
    cta2: 'Scopri i corsi',
    words: ['al lavoro', 'in viaggio', 'a scuola', 'ogni giorno', 'senza paura']
  },
  stats: [
    { value: 1, suffix: ':1', label: 'Lezioni individuali accessibili' },
    { value: 100, suffix: '%', label: 'Online o in presenza a Roma' },
    { value: 48, suffix: 'h', label: 'Tempo di risposta alla tua richiesta' },
    { value: 0, suffix: '€', label: 'Costo della lezione di prova' }
  ],
  audiences: [
    { id: 'bambini', icon: '🧸', title: 'Bambini', text: 'Imparare giocando: storie, canzoni e attività creative per costruire fiducia fin dal primo giorno.', tag: '4–13 anni' },
    { id: 'adulti', icon: '🎯', title: 'Adulti', text: 'Dal livello zero al B2/C1: conversazione, lavoro, viaggi, certificazioni. Il ritmo lo decidi tu.', tag: 'Tutti i livelli' },
    { id: 'azienda', icon: '🏢', title: 'Aziende', text: 'Business English su misura per team e professionisti: fatturazione aziendale e orari flessibili.', tag: 'Team & P.IVA' }
  ],
  modes: [
    { title: 'Individuale', text: 'Un insegnante tutto per te. Programma costruito sui tuoi obiettivi, orari che si adattano alla tua vita.' },
    { title: 'Piccolo gruppo', text: 'Massimo 6 persone. Si impara di più, si spende di meno e ci si diverte parlando davvero.' },
    { title: 'Online', text: 'Da tutta Italia, dove vuoi. Piattaforma semplice, nessuna installazione, lezioni registrabili su richiesta.' },
    { title: 'In presenza a Roma', text: 'Aule accoglienti e attrezzate per lezioni dal vivo, anche per i più piccoli.' }
  ],
  steps: [
    { title: 'Ci scrivi', text: 'Compili il modulo in 1 minuto. Nessun impegno.' },
    { title: 'Test + prova gratuita', text: 'Valutiamo il tuo livello e proviamo insieme una lezione.' },
    { title: 'Piano su misura', text: 'Ti proponiamo un percorso chiaro, con prezzo e calendario.' },
    { title: 'Inizi a parlare', text: 'Lezioni, feedback e progressi sempre sotto controllo.' }
  ],
  packs: [
    { name: 'Start', lessons: 10, price: 290, note: 'Per cominciare o ripartire', features: ['10 lezioni individuali da 60 min', 'Test di livello incluso', 'Materiali digitali inclusi'], featured: false },
    { name: 'Boost', lessons: 20, price: 520, note: 'Il più scelto', features: ['20 lezioni individuali da 60 min', 'Piano di studio personalizzato', 'Feedback scritto mensile', 'Recupero lezioni entro 24h'], featured: true },
    { name: 'Pro', lessons: 40, price: 960, note: 'Per obiettivi ambiziosi e aziende', features: ['40 lezioni individuali da 60 min', 'Preparazione certificazioni / Business English', 'Fattura aziendale e rateizzazione', 'Referente dedicato'], featured: false }
  ],
  priceNote: 'Prezzi indicativi della demo, modificabili dal pannello. Lezioni in presenza a Roma: supplemento da concordare.',
  faq: [
    { q: 'La lezione di prova è davvero gratuita?', a: 'Sì. Facciamo un breve test di livello e una mini-lezione, senza alcun obbligo di proseguire.' },
    { q: 'Posso seguire i corsi se vivo fuori Roma?', a: 'Certo: tutti i corsi sono disponibili online in tutta Italia. Le lezioni in presenza si svolgono a Roma.' },
    { q: 'Fate corsi per le aziende?', a: 'Sì, con programmi su misura, fatturazione aziendale e orari compatibili con il lavoro del team.' },
    { q: 'Come funzionano le lezioni per i bambini?', a: 'Sono brevi, giocose e guidate da insegnanti abituati a lavorare con i più piccoli. I genitori ricevono un feedback periodico.' },
    { q: 'Posso spostare una lezione?', a: 'Sì, avvisandoci con almeno 24 ore di anticipo la lezione viene recuperata senza costi.' }
  ],
  cta: {
    title: 'Pronto a partire?',
    text: 'Raccontaci cosa ti serve: ti rispondiamo entro 48 ore con una proposta chiara e senza impegno.'
  }
};
