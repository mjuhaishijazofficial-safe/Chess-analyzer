export const LOCALES = [
  "en",
  "es",
  "ru",
  "pt",
  "hi",
  "fr",
  "de",
  "tr",
  "id",
  "ar",
  "it",
  "ur",
] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
  pt: "Português",
  hi: "हिन्दी",
  fr: "Français",
  de: "Deutsch",
  tr: "Türkçe",
  id: "Bahasa Indonesia",
  ar: "العربية",
  it: "Italiano",
  ur: "اردو",
};

export const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar", "ur"]);

export type TranslationKey =
  | "hero.badge"
  | "hero.title1"
  | "hero.title2"
  | "hero.description"
  | "nav.myChessJourney"
  | "nav.compareTwoPlayers"
  | "stat.timeControls"
  | "stat.gamesInArchive"
  | "stat.engineReviewDepth"
  | "hud.bestOfEra"
  | "hud.liveRatings"
  | "rating.bullet"
  | "rating.blitz"
  | "rating.rapid"
  | "feature1.title"
  | "feature1.body"
  | "feature2.title"
  | "feature2.body"
  | "feature3.title"
  | "feature3.body"
  | "howItWorks.heading"
  | "step1.title"
  | "step1.body"
  | "step2.title"
  | "step2.body"
  | "step3.title"
  | "step3.body"
  | "footer.oauthNote";

export const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    "hero.badge": "ONLINE · CHESS.COM + LICHESS",
    "hero.title1": "LEVEL UP",
    "hero.title2": "YOUR CHESS",
    "hero.description":
      "Drop your Chess.com or Lichess username and instantly unlock your stats, ratings and full game history — then run a Stockfish game review on any match, move by move.",
    "nav.myChessJourney": "My Chess Journey",
    "nav.compareTwoPlayers": "Compare two players",
    "stat.timeControls": "Time controls",
    "stat.gamesInArchive": "Games in your archive",
    "stat.engineReviewDepth": "Engine review depth",
    "hud.bestOfEra": "Best of this era",
    "hud.liveRatings": "live ratings, straight from Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rapid",
    "feature1.title": "Your profile",
    "feature1.body":
      "Avatar, title, country, league, followers and join date — your full identity card, straight from Chess.com or Lichess.",
    "feature2.title": "Ratings & records",
    "feature2.body":
      "Bullet, blitz, rapid and daily ratings with peak highs, win/loss/draw records and win-rate per format.",
    "feature3.title": "Engine game review",
    "feature3.body":
      "Step through any game on a live board. Every move graded Best → Blunder with the engine's line and accuracy %.",
    "howItWorks.heading": "// how it works",
    "step1.title": "Enter your username",
    "step1.body":
      "No password, no OAuth dance. Chess.com and Lichess both publish this data openly — your username is the only key.",
    "step2.title": "We pull your data",
    "step2.body":
      "ChessDeeper calls the official public API of whichever platform you pick and assembles your profile, stats and games in seconds.",
    "step3.title": "Play it back",
    "step3.body":
      "Explore your dashboard and replay any game with full Stockfish analysis. Share it — it's just /player/your-name.",
    "footer.oauthNote":
      "Chess.com's OAuth program is invite-only and Lichess games are public by default, so \"login\" here means identifying yourself by your public username — only data already visible on your profile is ever shown.",
  },
  es: {
    "hero.badge": "EN LÍNEA · CHESS.COM + LICHESS",
    "hero.title1": "MEJORA TU",
    "hero.title2": "AJEDREZ",
    "hero.description":
      "Ingresa tu usuario de Chess.com o Lichess y desbloquea al instante tus estadísticas, clasificaciones e historial completo de partidas — luego ejecuta un análisis con Stockfish en cualquier partida, jugada por jugada.",
    "nav.myChessJourney": "Mi trayectoria de ajedrez",
    "nav.compareTwoPlayers": "Comparar dos jugadores",
    "stat.timeControls": "Ritmos de juego",
    "stat.gamesInArchive": "Partidas en tu archivo",
    "stat.engineReviewDepth": "Profundidad del motor",
    "hud.bestOfEra": "Lo mejor de esta era",
    "hud.liveRatings": "clasificaciones en vivo, directo de Chess.com",
    "rating.bullet": "Bala",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rápidas",
    "feature1.title": "Tu perfil",
    "feature1.body":
      "Avatar, título, país, liga, seguidores y fecha de registro — tu carné de identidad completo, directo de Chess.com o Lichess.",
    "feature2.title": "Clasificaciones y récords",
    "feature2.body":
      "Clasificaciones de bala, blitz, rápidas y diarias con máximos históricos, récords de victorias/derrotas/tablas y porcentaje de victorias por formato.",
    "feature3.title": "Análisis con motor",
    "feature3.body":
      "Recorre cualquier partida en un tablero interactivo. Cada jugada calificada de Mejor a Error grave, con la línea del motor y el porcentaje de precisión.",
    "howItWorks.heading": "// cómo funciona",
    "step1.title": "Ingresa tu usuario",
    "step1.body":
      "Sin contraseña, sin trámites de OAuth. Chess.com y Lichess publican estos datos abiertamente — tu usuario es la única clave.",
    "step2.title": "Obtenemos tus datos",
    "step2.body":
      "ChessDeeper llama a la API pública oficial de la plataforma que elijas y arma tu perfil, estadísticas y partidas en segundos.",
    "step3.title": "Repásalo",
    "step3.body":
      "Explora tu panel y repasa cualquier partida con análisis completo de Stockfish. Compártelo — es solo /player/tu-nombre.",
    "footer.oauthNote":
      "El programa OAuth de Chess.com es solo por invitación y las partidas de Lichess son públicas por defecto, así que \"iniciar sesión\" aquí significa identificarte con tu usuario público — solo se muestran datos ya visibles en tu perfil.",
  },
  ru: {
    "hero.badge": "ОНЛАЙН · CHESS.COM + LICHESS",
    "hero.title1": "ПРОКАЧАЙ",
    "hero.title2": "СВОЯ ИГРУ",
    "hero.description":
      "Введите имя пользователя Chess.com или Lichess и мгновенно получите доступ к статистике, рейтингам и полной истории партий — затем запустите разбор партии Stockfish, ход за ходом.",
    "nav.myChessJourney": "Мой шахматный путь",
    "nav.compareTwoPlayers": "Сравнить двух игроков",
    "stat.timeControls": "Контроли времени",
    "stat.gamesInArchive": "Партий в архиве",
    "stat.engineReviewDepth": "Глубина анализа движка",
    "hud.bestOfEra": "Лучшие этой эпохи",
    "hud.liveRatings": "рейтинги в реальном времени, прямо с Chess.com",
    "rating.bullet": "Пуля",
    "rating.blitz": "Блиц",
    "rating.rapid": "Рапид",
    "feature1.title": "Ваш профиль",
    "feature1.body":
      "Аватар, звание, страна, лига, подписчики и дата регистрации — ваша полная карточка личности прямо с Chess.com или Lichess.",
    "feature2.title": "Рейтинги и рекорды",
    "feature2.body":
      "Рейтинги пули, блица, рапида и дневных партий с пиковыми значениями, статистикой побед/поражений/ничьих и процентом побед по форматам.",
    "feature3.title": "Разбор партии движком",
    "feature3.body":
      "Просматривайте любую партию на живой доске. Каждый ход оценён от «Лучший» до «Зевок» с линией движка и процентом точности.",
    "howItWorks.heading": "// как это работает",
    "step1.title": "Введите имя пользователя",
    "step1.body":
      "Без пароля, без танцев с OAuth. И Chess.com, и Lichess открыто публикуют эти данные — ваше имя пользователя — единственный ключ.",
    "step2.title": "Мы получаем ваши данные",
    "step2.body":
      "ChessDeeper обращается к официальному публичному API выбранной платформы и за секунды собирает ваш профиль, статистику и партии.",
    "step3.title": "Пересмотрите партию",
    "step3.body":
      "Изучайте панель и пересматривайте любую партию с полным анализом Stockfish. Поделитесь — это просто /player/ваше-имя.",
    "footer.oauthNote":
      "Программа OAuth Chess.com доступна только по приглашению, а партии Lichess по умолчанию публичны, поэтому «вход» здесь означает лишь указание вашего публичного имени пользователя — показываются только данные, уже видимые в вашем профиле.",
  },
  pt: {
    "hero.badge": "ONLINE · CHESS.COM + LICHESS",
    "hero.title1": "ELEVE SEU",
    "hero.title2": "XADREZ",
    "hero.description":
      "Informe seu usuário do Chess.com ou Lichess e desbloqueie na hora suas estatísticas, classificações e histórico completo de partidas — depois rode uma análise com Stockfish em qualquer partida, lance a lance.",
    "nav.myChessJourney": "Minha jornada no xadrez",
    "nav.compareTwoPlayers": "Comparar dois jogadores",
    "stat.timeControls": "Ritmos de jogo",
    "stat.gamesInArchive": "Partidas no seu arquivo",
    "stat.engineReviewDepth": "Profundidade do motor",
    "hud.bestOfEra": "Os melhores desta era",
    "hud.liveRatings": "classificações ao vivo, direto do Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rápidas",
    "feature1.title": "Seu perfil",
    "feature1.body":
      "Avatar, título, país, liga, seguidores e data de entrada — seu cartão de identidade completo, direto do Chess.com ou Lichess.",
    "feature2.title": "Classificações e recordes",
    "feature2.body":
      "Classificações de bullet, blitz, rápidas e diárias com picos históricos, recordes de vitórias/derrotas/empates e taxa de vitória por formato.",
    "feature3.title": "Análise de partida com motor",
    "feature3.body":
      "Percorra qualquer partida em um tabuleiro interativo. Cada lance classificado de Ótimo a Erro grave, com a linha do motor e a precisão em %.",
    "howItWorks.heading": "// como funciona",
    "step1.title": "Informe seu usuário",
    "step1.body":
      "Sem senha, sem burocracia de OAuth. Chess.com e Lichess publicam esses dados abertamente — seu usuário é a única chave.",
    "step2.title": "Buscamos seus dados",
    "step2.body":
      "O ChessDeeper chama a API pública oficial da plataforma escolhida e monta seu perfil, estatísticas e partidas em segundos.",
    "step3.title": "Reveja tudo",
    "step3.body":
      "Explore seu painel e reveja qualquer partida com análise completa do Stockfish. Compartilhe — é só /player/seu-nome.",
    "footer.oauthNote":
      "O programa OAuth do Chess.com é apenas por convite e as partidas do Lichess são públicas por padrão, então \"login\" aqui significa apenas se identificar pelo seu usuário público — só dados já visíveis no seu perfil são exibidos.",
  },
  hi: {
    "hero.badge": "ऑनलाइन · CHESS.COM + LICHESS",
    "hero.title1": "अपनी बिसात",
    "hero.title2": "बेहतर बनाएं",
    "hero.description":
      "अपना Chess.com या Lichess यूज़रनेम डालें और तुरंत अपने स्टैट्स, रेटिंग्स और पूरा गेम इतिहास देखें — फिर किसी भी मैच पर मूव-दर-मूव Stockfish गेम रिव्यू चलाएं।",
    "nav.myChessJourney": "मेरी शतरंज यात्रा",
    "nav.compareTwoPlayers": "दो खिलाड़ियों की तुलना करें",
    "stat.timeControls": "टाइम कंट्रोल्स",
    "stat.gamesInArchive": "आपके संग्रह में गेम्स",
    "stat.engineReviewDepth": "इंजन रिव्यू गहराई",
    "hud.bestOfEra": "इस युग के सर्वश्रेष्ठ",
    "hud.liveRatings": "लाइव रेटिंग्स, सीधे Chess.com से",
    "rating.bullet": "बुलेट",
    "rating.blitz": "ब्लिट्ज़",
    "rating.rapid": "रैपिड",
    "feature1.title": "आपकी प्रोफ़ाइल",
    "feature1.body":
      "अवतार, टाइटल, देश, लीग, फॉलोअर्स और जॉइन डेट — आपका पूरा पहचान कार्ड, सीधे Chess.com या Lichess से।",
    "feature2.title": "रेटिंग्स और रिकॉर्ड्स",
    "feature2.body":
      "बुलेट, ब्लिट्ज़, रैपिड और डेली रेटिंग्स के साथ पीक हाई, जीत/हार/ड्रॉ रिकॉर्ड और हर फॉर्मेट की जीत दर।",
    "feature3.title": "इंजन गेम रिव्यू",
    "feature3.body":
      "किसी भी गेम को लाइव बोर्ड पर देखें। हर चाल को Best से Blunder तक ग्रेड किया गया, इंजन की लाइन और सटीकता % के साथ।",
    "howItWorks.heading": "// यह कैसे काम करता है",
    "step1.title": "अपना यूज़रनेम डालें",
    "step1.body":
      "कोई पासवर्ड नहीं, कोई OAuth झंझट नहीं। Chess.com और Lichess दोनों यह डेटा खुले तौर पर प्रकाशित करते हैं — आपका यूज़रनेम ही एकमात्र चाबी है।",
    "step2.title": "हम आपका डेटा लाते हैं",
    "step2.body":
      "ChessDeeper आपके चुने गए प्लेटफ़ॉर्म के आधिकारिक पब्लिक API को कॉल करता है और सेकंडों में आपकी प्रोफ़ाइल, स्टैट्स और गेम्स तैयार कर देता है।",
    "step3.title": "इसे दोबारा देखें",
    "step3.body":
      "अपना डैशबोर्ड एक्सप्लोर करें और पूरे Stockfish विश्लेषण के साथ कोई भी गेम दोबारा देखें। शेयर करें — यह बस /player/आपका-नाम है।",
    "footer.oauthNote":
      "Chess.com का OAuth प्रोग्राम केवल आमंत्रण पर है और Lichess के गेम डिफ़ॉल्ट रूप से सार्वजनिक होते हैं, इसलिए यहाँ \"लॉगिन\" का मतलब सिर्फ अपने पब्लिक यूज़रनेम से पहचान देना है — केवल वही डेटा दिखाया जाता है जो पहले से आपकी प्रोफ़ाइल पर दिखता है।",
  },
  fr: {
    "hero.badge": "EN LIGNE · CHESS.COM + LICHESS",
    "hero.title1": "AMÉLIOREZ VOTRE",
    "hero.title2": "JEU D'ÉCHECS",
    "hero.description":
      "Entrez votre nom d'utilisateur Chess.com ou Lichess et débloquez instantanément vos statistiques, classements et historique complet de parties — puis lancez une analyse Stockfish sur n'importe quelle partie, coup par coup.",
    "nav.myChessJourney": "Mon parcours aux échecs",
    "nav.compareTwoPlayers": "Comparer deux joueurs",
    "stat.timeControls": "Cadences",
    "stat.gamesInArchive": "Parties dans vos archives",
    "stat.engineReviewDepth": "Profondeur du moteur",
    "hud.bestOfEra": "Les meilleurs de cette ère",
    "hud.liveRatings": "classements en direct, depuis Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Cadence rapide",
    "feature1.title": "Votre profil",
    "feature1.body":
      "Avatar, titre, pays, ligue, abonnés et date d'inscription — votre carte d'identité complète, tout droit de Chess.com ou Lichess.",
    "feature2.title": "Classements et records",
    "feature2.body":
      "Classements bullet, blitz, rapide et journalier avec pics historiques, bilan victoires/défaites/nulles et taux de victoire par format.",
    "feature3.title": "Analyse de partie par moteur",
    "feature3.body":
      "Parcourez n'importe quelle partie sur un échiquier interactif. Chaque coup noté de Meilleur à Gaffe, avec la ligne du moteur et le pourcentage de précision.",
    "howItWorks.heading": "// comment ça marche",
    "step1.title": "Entrez votre nom d'utilisateur",
    "step1.body":
      "Pas de mot de passe, pas de danse OAuth. Chess.com et Lichess publient ces données ouvertement — votre nom d'utilisateur est la seule clé.",
    "step2.title": "Nous récupérons vos données",
    "step2.body":
      "ChessDeeper appelle l'API publique officielle de la plateforme choisie et assemble votre profil, vos statistiques et vos parties en quelques secondes.",
    "step3.title": "Revisionnez",
    "step3.body":
      "Explorez votre tableau de bord et revisionnez n'importe quelle partie avec une analyse Stockfish complète. Partagez-la — c'est simplement /player/votre-nom.",
    "footer.oauthNote":
      "Le programme OAuth de Chess.com est sur invitation uniquement et les parties Lichess sont publiques par défaut, donc « connexion » ici signifie simplement s'identifier par son nom d'utilisateur public — seules les données déjà visibles sur votre profil sont affichées.",
  },
  de: {
    "hero.badge": "ONLINE · CHESS.COM + LICHESS",
    "hero.title1": "VERBESSERE DEIN",
    "hero.title2": "SCHACHSPIEL",
    "hero.description":
      "Gib deinen Chess.com- oder Lichess-Benutzernamen ein und erhalte sofort deine Statistiken, Wertungen und die komplette Partiehistorie — starte danach eine Stockfish-Partieanalyse für jede Partie, Zug für Zug.",
    "nav.myChessJourney": "Meine Schachreise",
    "nav.compareTwoPlayers": "Zwei Spieler vergleichen",
    "stat.timeControls": "Zeitkontrollen",
    "stat.gamesInArchive": "Partien in deinem Archiv",
    "stat.engineReviewDepth": "Engine-Analysetiefe",
    "hud.bestOfEra": "Die Besten dieser Ära",
    "hud.liveRatings": "Live-Wertungen, direkt von Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rapid",
    "feature1.title": "Dein Profil",
    "feature1.body":
      "Avatar, Titel, Land, Liga, Follower und Beitrittsdatum — deine vollständige Identitätskarte, direkt von Chess.com oder Lichess.",
    "feature2.title": "Wertungen & Rekorde",
    "feature2.body":
      "Bullet-, Blitz-, Rapid- und Tageswertungen mit Höchstständen, Sieg/Niederlage/Remis-Bilanz und Gewinnrate pro Format.",
    "feature3.title": "Engine-Partieanalyse",
    "feature3.body":
      "Gehe jede Partie auf einem interaktiven Brett durch. Jeder Zug bewertet von Beste bis Patzer, mit Engine-Variante und Genauigkeit in %.",
    "howItWorks.heading": "// so funktioniert's",
    "step1.title": "Benutzernamen eingeben",
    "step1.body":
      "Kein Passwort, kein OAuth-Tanz. Chess.com und Lichess veröffentlichen diese Daten offen — dein Benutzername ist der einzige Schlüssel.",
    "step2.title": "Wir holen deine Daten",
    "step2.body":
      "ChessDeeper ruft die offizielle öffentliche API der gewählten Plattform auf und stellt dein Profil, deine Statistiken und Partien in Sekunden zusammen.",
    "step3.title": "Noch einmal ansehen",
    "step3.body":
      "Erkunde dein Dashboard und lass jede Partie mit vollständiger Stockfish-Analyse noch einmal ablaufen. Teile sie — es ist einfach /player/dein-name.",
    "footer.oauthNote":
      "Chess.coms OAuth-Programm ist nur auf Einladung und Lichess-Partien sind standardmäßig öffentlich, daher bedeutet „Login“ hier lediglich, sich mit dem öffentlichen Benutzernamen zu identifizieren — es werden nur Daten gezeigt, die auf deinem Profil ohnehin sichtbar sind.",
  },
  tr: {
    "hero.badge": "ÇEVRİM İÇİ · CHESS.COM + LICHESS",
    "hero.title1": "SATRANCINI",
    "hero.title2": "ZİRVEYE TAŞI",
    "hero.description":
      "Chess.com veya Lichess kullanıcı adını gir, istatistiklerine, derecelendirmelerine ve tüm oyun geçmişine anında ulaş — ardından herhangi bir maçta hamle hamle Stockfish oyun incelemesi çalıştır.",
    "nav.myChessJourney": "Satranç Yolculuğum",
    "nav.compareTwoPlayers": "İki oyuncuyu karşılaştır",
    "stat.timeControls": "Zaman kontrolleri",
    "stat.gamesInArchive": "Arşivindeki oyunlar",
    "stat.engineReviewDepth": "Motor inceleme derinliği",
    "hud.bestOfEra": "Bu çağın en iyileri",
    "hud.liveRatings": "canlı derecelendirmeler, doğrudan Chess.com'dan",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Hızlı",
    "feature1.title": "Profilin",
    "feature1.body":
      "Avatar, unvan, ülke, lig, takipçiler ve katılım tarihi — doğrudan Chess.com veya Lichess'ten tam kimlik kartın.",
    "feature2.title": "Derecelendirmeler ve rekorlar",
    "feature2.body":
      "Zirve değerleriyle bullet, blitz, hızlı ve günlük derecelendirmeler, galibiyet/mağlubiyet/beraberlik kayıtları ve formata göre kazanma oranı.",
    "feature3.title": "Motor oyun incelemesi",
    "feature3.body":
      "Herhangi bir oyunu canlı tahtada adım adım incele. Her hamle En İyi'den Gaf'a kadar derecelendirilir, motor hattı ve doğruluk yüzdesiyle birlikte.",
    "howItWorks.heading": "// nasıl çalışır",
    "step1.title": "Kullanıcı adını gir",
    "step1.body":
      "Şifre yok, OAuth zahmeti yok. Chess.com ve Lichess bu verileri açıkça yayınlar — kullanıcı adın tek anahtardır.",
    "step2.title": "Verilerini çekiyoruz",
    "step2.body":
      "ChessDeeper seçtiğin platformun resmi genel API'sini çağırır ve profilini, istatistiklerini ve oyunlarını saniyeler içinde bir araya getirir.",
    "step3.title": "Tekrar izle",
    "step3.body":
      "Panelini keşfet ve herhangi bir oyunu tam Stockfish analiziyle tekrar izle. Paylaş — sadece /player/kullanıcı-adın.",
    "footer.oauthNote":
      "Chess.com'un OAuth programı yalnızca davetle çalışır ve Lichess oyunları varsayılan olarak herkese açıktır, bu yüzden buradaki \"giriş\" yalnızca genel kullanıcı adınla kendini tanıtman anlamına gelir — sadece profilinde zaten görünen veriler gösterilir.",
  },
  id: {
    "hero.badge": "ONLINE · CHESS.COM + LICHESS",
    "hero.title1": "TINGKATKAN",
    "hero.title2": "CATURMU",
    "hero.description":
      "Masukkan username Chess.com atau Lichess kamu dan langsung buka statistik, rating, serta riwayat permainan lengkap — lalu jalankan review permainan Stockfish di pertandingan mana pun, langkah demi langkah.",
    "nav.myChessJourney": "Perjalanan Caturku",
    "nav.compareTwoPlayers": "Bandingkan dua pemain",
    "stat.timeControls": "Kontrol waktu",
    "stat.gamesInArchive": "Permainan di arsipmu",
    "stat.engineReviewDepth": "Kedalaman analisis engine",
    "hud.bestOfEra": "Yang terbaik di era ini",
    "hud.liveRatings": "rating langsung, dari Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rapid",
    "feature1.title": "Profilmu",
    "feature1.body":
      "Avatar, gelar, negara, liga, pengikut, dan tanggal bergabung — kartu identitas lengkapmu, langsung dari Chess.com atau Lichess.",
    "feature2.title": "Rating & rekor",
    "feature2.body":
      "Rating bullet, blitz, rapid, dan harian dengan puncak tertinggi, rekor menang/kalah/seri, dan win-rate per format.",
    "feature3.title": "Review permainan engine",
    "feature3.body":
      "Telusuri permainan apa pun di papan langsung. Setiap langkah dinilai dari Terbaik hingga Blunder, lengkap dengan jalur engine dan persentase akurasi.",
    "howItWorks.heading": "// cara kerjanya",
    "step1.title": "Masukkan username-mu",
    "step1.body":
      "Tanpa kata sandi, tanpa ribetnya OAuth. Chess.com dan Lichess sama-sama mempublikasikan data ini secara terbuka — username-mu adalah satu-satunya kunci.",
    "step2.title": "Kami ambil datamu",
    "step2.body":
      "ChessDeeper memanggil API publik resmi dari platform pilihanmu dan menyusun profil, statistik, serta permainanmu dalam hitungan detik.",
    "step3.title": "Putar ulang",
    "step3.body":
      "Jelajahi dashboard-mu dan putar ulang permainan apa pun dengan analisis Stockfish lengkap. Bagikan — cukup /player/nama-kamu.",
    "footer.oauthNote":
      "Program OAuth Chess.com hanya berdasarkan undangan dan permainan Lichess bersifat publik secara default, jadi \"login\" di sini hanya berarti mengidentifikasi dirimu lewat username publikmu — hanya data yang sudah terlihat di profilmu yang ditampilkan.",
  },
  ar: {
    "hero.badge": "متصل · CHESS.COM + LICHESS",
    "hero.title1": "طوّر مستواك",
    "hero.title2": "في الشطرنج",
    "hero.description":
      "أدخل اسم المستخدم الخاص بك في Chess.com أو Lichess واحصل فورًا على إحصائياتك وتصنيفاتك وسجل مبارياتك الكامل — ثم شغّل مراجعة Stockfish لأي مباراة، نقلة بنقلة.",
    "nav.myChessJourney": "رحلتي في الشطرنج",
    "nav.compareTwoPlayers": "قارن بين لاعبَين",
    "stat.timeControls": "أنظمة التوقيت",
    "stat.gamesInArchive": "المباريات في أرشيفك",
    "stat.engineReviewDepth": "عمق تحليل المحرك",
    "hud.bestOfEra": "الأفضل في هذا العصر",
    "hud.liveRatings": "تصنيفات مباشرة من Chess.com",
    "rating.bullet": "بولت",
    "rating.blitz": "بليتز",
    "rating.rapid": "سريع",
    "feature1.title": "ملفك الشخصي",
    "feature1.body":
      "الصورة الرمزية واللقب والبلد والدوري والمتابعون وتاريخ الانضمام — بطاقة هويتك الكاملة، مباشرة من Chess.com أو Lichess.",
    "feature2.title": "التصنيفات والأرقام القياسية",
    "feature2.body":
      "تصنيفات البولت والبليتز والسريع واليومي مع أعلى المستويات، وسجلات الفوز/الخسارة/التعادل، ونسبة الفوز لكل نمط.",
    "feature3.title": "مراجعة المباراة بالمحرك",
    "feature3.body":
      "تصفّح أي مباراة على رقعة حية. تُقيَّم كل نقلة من الأفضل إلى الخطأ الفادح، مع خط المحرك ونسبة الدقة.",
    "howItWorks.heading": "// كيف يعمل",
    "step1.title": "أدخل اسم المستخدم",
    "step1.body":
      "بدون كلمة مرور، وبدون تعقيدات OAuth. كل من Chess.com و Lichess ينشران هذه البيانات علنًا — اسم المستخدم هو المفتاح الوحيد.",
    "step2.title": "نجلب بياناتك",
    "step2.body":
      "يستدعي ChessDeeper واجهة برمجة التطبيقات العامة الرسمية للمنصة التي تختارها، ويجمّع ملفك الشخصي وإحصائياتك ومبارياتك في ثوانٍ.",
    "step3.title": "أعد المشاهدة",
    "step3.body":
      "استكشف لوحتك وأعد مشاهدة أي مباراة بتحليل Stockfish كامل. شاركها — إنها ببساطة /player/اسمك.",
    "footer.oauthNote":
      "برنامج OAuth الخاص بـ Chess.com يعمل بالدعوة فقط، ومباريات Lichess عامة افتراضيًا، لذا فإن \"تسجيل الدخول\" هنا يعني فقط التعرّف بنفسك عبر اسم المستخدم العام — تُعرض فقط البيانات الظاهرة أصلًا في ملفك الشخصي.",
  },
  it: {
    "hero.badge": "ONLINE · CHESS.COM + LICHESS",
    "hero.title1": "MIGLIORA I TUOI",
    "hero.title2": "SCACCHI",
    "hero.description":
      "Inserisci il tuo nome utente Chess.com o Lichess e sblocca all'istante statistiche, classifiche e cronologia completa delle partite — poi avvia un'analisi Stockfish su qualsiasi partita, mossa per mossa.",
    "nav.myChessJourney": "Il mio percorso scacchistico",
    "nav.compareTwoPlayers": "Confronta due giocatori",
    "stat.timeControls": "Ritmi di gioco",
    "stat.gamesInArchive": "Partite nel tuo archivio",
    "stat.engineReviewDepth": "Profondità del motore",
    "hud.bestOfEra": "I migliori di questa era",
    "hud.liveRatings": "classifiche in tempo reale, direttamente da Chess.com",
    "rating.bullet": "Bullet",
    "rating.blitz": "Blitz",
    "rating.rapid": "Rapide",
    "feature1.title": "Il tuo profilo",
    "feature1.body":
      "Avatar, titolo, paese, lega, follower e data di iscrizione — la tua carta d'identità completa, direttamente da Chess.com o Lichess.",
    "feature2.title": "Classifiche e record",
    "feature2.body":
      "Classifiche bullet, blitz, rapide e giornaliere con i picchi massimi, il bilancio vittorie/sconfitte/patte e la percentuale di vittorie per formato.",
    "feature3.title": "Analisi partita con motore",
    "feature3.body":
      "Scorri qualsiasi partita su una scacchiera interattiva. Ogni mossa valutata da Ottima a Errore grave, con la linea del motore e la precisione in %.",
    "howItWorks.heading": "// come funziona",
    "step1.title": "Inserisci il tuo nome utente",
    "step1.body":
      "Niente password, niente trafila OAuth. Sia Chess.com che Lichess pubblicano questi dati apertamente — il tuo nome utente è l'unica chiave.",
    "step2.title": "Recuperiamo i tuoi dati",
    "step2.body":
      "ChessDeeper richiama l'API pubblica ufficiale della piattaforma scelta e assembla il tuo profilo, statistiche e partite in pochi secondi.",
    "step3.title": "Rivedila",
    "step3.body":
      "Esplora la tua dashboard e rivedi qualsiasi partita con l'analisi completa di Stockfish. Condividila — è semplicemente /player/tuo-nome.",
    "footer.oauthNote":
      "Il programma OAuth di Chess.com è solo su invito e le partite di Lichess sono pubbliche di default, quindi \"login\" qui significa semplicemente identificarti con il tuo nome utente pubblico — vengono mostrati solo dati già visibili sul tuo profilo.",
  },
  ur: {
    "hero.badge": "آن لائن · CHESS.COM + LICHESS",
    "hero.title1": "اپنی شطرنج",
    "hero.title2": "بہتر بنائیں",
    "hero.description":
      "اپنا Chess.com یا Lichess یوزرنیم درج کریں اور فوراً اپنے اسٹیٹس، ریٹنگز اور مکمل گیم ہسٹری دیکھیں — پھر کسی بھی میچ پر مووو بہ مووو Stockfish گیم ریویو چلائیں۔",
    "nav.myChessJourney": "میرا شطرنج کا سفر",
    "nav.compareTwoPlayers": "دو کھلاڑیوں کا موازنہ کریں",
    "stat.timeControls": "ٹائم کنٹرولز",
    "stat.gamesInArchive": "آپ کے آرکائیو میں گیمز",
    "stat.engineReviewDepth": "انجن ریویو گہرائی",
    "hud.bestOfEra": "اس دور کے بہترین",
    "hud.liveRatings": "لائیو ریٹنگز، براہ راست Chess.com سے",
    "rating.bullet": "بلٹ",
    "rating.blitz": "بلٹز",
    "rating.rapid": "ریپڈ",
    "feature1.title": "آپ کا پروفائل",
    "feature1.body":
      "ایواٹار، ٹائٹل، ملک، لیگ، فالوورز اور شمولیت کی تاریخ — آپ کا مکمل شناختی کارڈ، براہ راست Chess.com یا Lichess سے۔",
    "feature2.title": "ریٹنگز اور ریکارڈز",
    "feature2.body":
      "بلٹ، بلٹز، ریپڈ اور یومیہ ریٹنگز عروج کے ساتھ، جیت/ہار/ڈرا ریکارڈز اور ہر فارمیٹ کی جیت کی شرح۔",
    "feature3.title": "انجن گیم ریویو",
    "feature3.body":
      "کسی بھی گیم کو لائیو بورڈ پر دیکھیں۔ ہر چال کو بہترین سے لے کر بڑی غلطی تک درجہ دیا جاتا ہے، انجن کی لائن اور درستگی % کے ساتھ۔",
    "howItWorks.heading": "// یہ کیسے کام کرتا ہے",
    "step1.title": "اپنا یوزرنیم درج کریں",
    "step1.body":
      "نہ پاس ورڈ، نہ OAuth کی جھنجھٹ۔ Chess.com اور Lichess دونوں یہ ڈیٹا کھلے عام شائع کرتے ہیں — آپ کا یوزرنیم ہی واحد چابی ہے۔",
    "step2.title": "ہم آپ کا ڈیٹا لاتے ہیں",
    "step2.body":
      "ChessDeeper آپ کے منتخب کردہ پلیٹ فارم کے سرکاری پبلک API کو کال کرتا ہے اور سیکنڈوں میں آپ کا پروفائل، اسٹیٹس اور گیمز تیار کر دیتا ہے۔",
    "step3.title": "دوبارہ دیکھیں",
    "step3.body":
      "اپنا ڈیش بورڈ دیکھیں اور مکمل Stockfish تجزیے کے ساتھ کوئی بھی گیم دوبارہ دیکھیں۔ شیئر کریں — یہ بس /player/آپ-کا-نام ہے۔",
    "footer.oauthNote":
      "Chess.com کا OAuth پروگرام صرف دعوت پر ہے اور Lichess کے گیمز بذاتِ خود عوامی ہوتے ہیں، اس لیے یہاں \"لاگ ان\" کا مطلب صرف اپنے عوامی یوزرنیم سے شناخت کروانا ہے — صرف وہی ڈیٹا دکھایا جاتا ہے جو پہلے سے آپ کی پروفائل پر نظر آتا ہے۔",
  },
};
