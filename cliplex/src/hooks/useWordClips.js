import { useCallback, useMemo, useState } from 'react';
import { getClips } from '../services/apiClient.js';

export const SAMPLE_DATABASE = {
  en: [
    {
      word: 'wardrobe',
      phonetic: '/ˈwɔːdrəʊb/',
      dictionaryMeaning: {
        es: 'Armario, ropero / Colección de ropa',
        pt: 'Guarda-roupa / Coleção de roupas',
        it: 'Armadio / Guardaroba',
        de: 'Kleiderschrank / Garderobe'
      },
      slangContext: 'Used both for bedroom furniture and personal fashion style collection.',
      clips: [
        {
          id: 'en_w1',
          creator: '@london_threads',
          accent: 'UK Accent • 1.0x Real',
          contextName: '👗 Fashion Haul',
          bgTheme: 'from-purple-900 via-indigo-950 to-slate-950',
          targetSentence: "I'm completely revamping my spring wardrobe with minimalist tailored coats.",
          translations: {
            es: 'Estoy renovando por completo mi armario de primavera con abrigos minimalistas.',
            pt: 'Estou renovando completamente meu guarda-roupa de primavera com casacos minimalistas.',
            it: 'Sto rinnovando completamente il mio guardaroba primaverile con cappotti minimalisti.',
            de: 'Ich erneuere meine Frühlingsgarderobe komplett mit minimalistischen Mänteln.'
          }
        },
        {
          id: 'en_w2',
          creator: '@decor_with_sarah',
          accent: 'US Accent • Smooth',
          contextName: '🏡 Interior Decor',
          bgTheme: 'from-amber-950 via-stone-900 to-black',
          targetSentence: "We decided to build a custom vintage wardrobe inside the master bedroom.",
          translations: {
            es: 'Decidimos construir un armario vintage personalizado dentro del dormitorio principal.',
            pt: 'Decidimos construir um guarda-roupa vintage sob medida no quarto principal.',
            it: 'Abbiamo deciso di costruire un armadio vintage su misura nella camera da letto principale.',
            de: 'Wir haben beschlossen, einen maßgefertigten Vintage-Kleiderschrank im Hauptschlafzimmer zu bauen.'
          }
        },
        {
          id: 'en_w3',
          creator: '@movie_buff_leo',
          accent: 'US Accent • Fast Slang',
          contextName: '🎬 Narnia Film Review',
          bgTheme: 'from-blue-950 via-cyan-950 to-slate-950',
          targetSentence: "Remember when Lucy stepped right through the magical wardrobe into Narnia?",
          translations: {
            es: '¿Recuerdas cuando Lucy atravesó el armario mágico directamente hacia Narnia?',
            pt: 'Lembra de quando a Lucy passou pelo guarda-roupa mágico direto para Nárnia?',
            it: 'Ricordi quando Lucy è passata attraverso l\'armadio magico per entrare a Narnia?',
            de: 'Erinnerst du dich, als Lucy durch den magischen Kleiderschrank nach Narnia trat?'
          }
        },
        {
          id: 'en_w4',
          creator: '@ny_moving_vlogs',
          accent: 'NY Accent • Rapid',
          contextName: '📦 Apartment Moving',
          bgTheme: 'from-emerald-950 via-slate-900 to-zinc-950',
          targetSentence: "Fitting this massive wardrobe up three flights of stairs was pure madness!",
          translations: {
            es: '¡Subir este enorme armario por tres tramos de escaleras fue una locura total!',
            pt: 'Subir esse guarda-roupa enorme por três lances de escada foi uma loucura pura!',
            it: 'Portare questo enorme armadio per tre rampe di scale è stata una vera follia!',
            de: 'Diesen riesigen Kleiderschrank drei Stockwerke hochzutragen war der reine Wahnsinn!'
          }
        }
      ]
    },
    {
      word: 'overwhelmed',
      phonetic: '/ˌəʊvəˈwelmd/',
      dictionaryMeaning: {
        es: 'Abrumado / Agobiado por exceso de emociones o trabajo',
        pt: 'Sobrecarregado / Empanturrado de emoções',
        it: 'Messo a dura prova / Sopraffatto',
        de: 'Überwältigt / Überfordert'
      },
      slangContext: 'Very common in tech, corporate & daily vlogs for burnout.',
      clips: [
        {
          id: 'en_o1',
          creator: '@tech_alex',
          accent: 'US Accent • Casual',
          contextName: '💻 Work Burnout',
          bgTheme: 'from-rose-950 via-slate-900 to-slate-950',
          targetSentence: "I was totally overwhelmed by all the emails sitting in my inbox today.",
          translations: {
            es: 'Estaba totalmente abrumado por todos los correos en mi bandeja de entrada hoy.',
            pt: 'Fiquei totalmente sobrecarregado com todos os e-mails na minha caixa de entrada.',
            it: 'Ero totalmente sopraffatto da tutte le email arrivate oggi.',
            de: 'Ich war heute von den vielen E-Mails in meinem Posteingang völlig überwältigt.'
          }
        },
        {
          id: 'en_o2',
          creator: '@chef_marco',
          accent: 'Aus Accent • Fast',
          contextName: '🍳 Kitchen Rush',
          bgTheme: 'from-orange-950 via-neutral-900 to-black',
          targetSentence: "During dinner service the orders piled up and the kitchen felt overwhelmed.",
          translations: {
            es: 'Durante el servicio de cena las órdenes se acumularon y la cocina se sintió abrumada.',
            pt: 'Durante o jantar os pedidos acumularam e a cozinha ficou sobrecarregada.',
            it: 'Durante il servizio serale le comande si sono accumulate e la cucina era sopraffatta.',
            de: 'Während des Abendessens sammelten sich die Bestellungen und die Küche war überfordert.'
          }
        }
      ]
    }
  ],
  es: [
    {
      word: 'sobremesa',
      phonetic: '/so.bɾeˈme.sa/',
      dictionaryMeaning: {
        en: 'Time spent lingering around the table after a meal chatting',
        pt: 'Tempo de conversa relaxada ao redor da mesa após a refeição',
        it: 'Chiacchierata rilassata a tavola dopo aver mangiato',
        de: 'Das gemütliche Beisammensein am Tisch nach dem Essen'
      },
      slangContext: 'Iconic Spanish cultural concept with no direct 1-word translation in English.',
      clips: [
        {
          id: 'es_s1',
          creator: '@madrid_gourmet',
          accent: 'España • Nativo Real',
          contextName: '🍷 Cultura y Tapas',
          bgTheme: 'from-red-950 via-stone-900 to-black',
          targetSentence: "Lo mejor de los domingos en España es disfrutar de una buena sobremesa de tres horas.",
          translations: {
            en: 'The best part of Sundays in Spain is enjoying a good three-hour post-meal table chat.',
            pt: 'A melhor parte dos domingos na Espanha é aproveitar uma boa sobremesa de três horas.',
            it: 'La parte migliore della domenica in Spagna è godersi una bella conversazione a tavola.',
            de: 'Das Beste am Sonntag in Spanien ist das dreistündige Beisammensein nach dem Essen.'
          }
        },
        {
          id: 'es_s2',
          creator: '@family_recetas',
          accent: 'México • Cálido',
          contextName: '🌮 Comida Familiar',
          bgTheme: 'from-amber-950 via-amber-900 to-zinc-950',
          targetSentence: "En mi casa la sobremesa con café y postre dura más que la propia comida.",
          translations: {
            en: 'At my house, lingering over coffee and dessert lasts longer than the meal itself.',
            pt: 'Na minha casa a conversa com café e sobremesa dura mais que o próprio almoço.',
            it: 'A casa mia la chiacchierata con caffè e dolce dura più del pranzo stesso.',
            de: 'Bei mir zu Hause dauert das Gespräch bei Kaffee und Nachtisch länger als das Essen.'
          }
        }
      ]
    },
    {
      word: 'madrugar',
      phonetic: '/ma.ðɾuˈɣaɾ/',
      dictionaryMeaning: {
        en: 'To wake up extremely early in the morning',
        pt: 'Acordar muito cedo de manhã',
        it: 'Svegliarsi molto presto la mattina',
        de: 'Früh am Morgen aufstehen'
      },
      slangContext: 'Verb specifically for morning risers.',
      clips: [
        {
          id: 'es_m1',
          creator: '@viajando_ando',
          accent: 'Colombia • Alegre',
          contextName: '✈️ Vuelo de Mañana',
          bgTheme: 'from-sky-950 via-slate-900 to-black',
          targetSentence: "Mañana me toca madrugar a las cuatro para alcanzar el vuelo al Caribe.",
          translations: {
            en: 'Tomorrow I have to wake up at 4 AM to catch my flight to the Caribbean.',
            pt: 'Amanhã tenho que acordar às quatro para pegar o voo para o Caribe.',
            it: 'Domani devo svegliarmi alle quattro per prendere il volo per i Caraibi.',
            de: 'Morgen muss ich um vier Uhr aufstehen, um den Flug in die Karibik zu erwischen.'
          }
        }
      ]
    }
  ],
  pt: [
    {
      word: 'saudade',
      phonetic: '/sawˈda.dʒi/',
      dictionaryMeaning: {
        en: 'Nostalgic longing or yearning for a person, place, or memory',
        es: 'Melancolía o nostalgia profunda por alguien o algo ausente',
        it: 'Nostalgia profonda e affettuosa per qualcosa o qualcuno',
        de: 'Sehnsucht nach einer Person oder Erinnerung'
      },
      slangContext: 'The most iconic Portuguese untranslatable emotional word.',
      clips: [
        {
          id: 'pt_s1',
          creator: '@rio_vibe_vlogs',
          accent: 'Brasil (Rio) • Poético',
          contextName: '🌊 Praia e Memórias',
          bgTheme: 'from-emerald-950 via-teal-950 to-slate-950',
          targetSentence: "Estou morrendo de saudade do pôr do sol na praia de Ipanema.",
          translations: {
            en: 'I miss the sunset at Ipanema beach so desperately.',
            es: 'Tengo muchísimo Used/nostalgia del atardecer en la playa de Ipanema.',
            it: 'Ho una grande nostalgia del tramonto sulla spiaggia di Ipanema.',
            de: 'Ich habe solche Sehnsucht nach dem Sonnenuntergang am Strand von Ipanema.'
          }
        }
      ]
    },
    {
      word: 'perrengue',
      phonetic: '/peˈʁẽ.ɡi/',
      dictionaryMeaning: {
        en: 'A tight spot, sticky situation, or travel mishap',
        es: 'Un apuro, contratiempo o percance en un viaje',
        it: 'Un imprevisto fastidioso o situazione complicata',
        de: 'Eine unangenehme Situation oder Reise-Panne'
      },
      slangContext: 'Slang term "Perrengue Chique" = fancy travel disaster.',
      clips: [
        {
          id: 'pt_p1',
          creator: '@mochila_sem_rumo',
          accent: 'Brasil (SP) • Rapidez',
          contextName: '🎒 Perrengue de Viagem',
          bgTheme: 'from-amber-950 via-orange-950 to-black',
          targetSentence: "Passamos o maior perrengue quando o pneu do carro furou no meio do nada!",
          translations: {
            en: 'We faced a huge predicament when our car tire popped in the middle of nowhere!',
            es: '¡Pasamos un gran apuro cuando se pinchó la llanta del auto en medio de la nada!',
            it: 'Abbiamo avuto un grosso problema quando si è bucata la gomma in mezzo al nulla!',
            de: 'Wir hatten eine Riesenpanne, als der Reifen mitten im Nirgendwo platzte!'
          }
        }
      ]
    }
  ],
  it: [
    {
      word: 'sprezzatura',
      phonetic: '/spret.tsaˈtu.ra/',
      dictionaryMeaning: {
        en: 'Studied carelessness, making something complex look effortless',
        es: 'Elegancia natural sin esfuerzo aparente',
        pt: 'Elegância natural e despreocupada',
        de: 'Mühelose Eleganz und lässige Perfektion'
      },
      slangContext: 'The core philosophy of high Italian fashion & style.',
      clips: [
        {
          id: 'it_sp1',
          creator: '@milano_style',
          accent: 'Milano • Elegante',
          contextName: '👔 High Fashion Vlog',
          bgTheme: 'from-stone-900 via-neutral-900 to-amber-950',
          targetSentence: "Il segreto del vero stile italiano sta tutto nella sprezzatura nei dettagli.",
          translations: {
            en: 'The secret of true Italian style lies entirely in effortless elegance in details.',
            es: 'El secreto del verdadero estilo italiano está en la elegancia sin esfuerzo de los detalles.',
            pt: 'O segredo do verdadeiro estilo italiano está na elegância sem esforço dos detalhes.',
            de: 'Das Geheimnis des echten italienischen Stils liegt in der mühelosen Eleganz der Details.'
          }
        }
      ]
    },
    {
      word: 'magari',
      phonetic: '/maˈɡa.ri/',
      dictionaryMeaning: {
        en: 'I wish! / If only / Maybe',
        es: '¡Ojalá! / Tal vez',
        pt: 'Quem me dera! / Talvez',
        de: 'Schön wäre es! / Wenn doch nur'
      },
      slangContext: 'Extremely versatile expressive Italian word.',
      clips: [
        {
          id: 'it_m1',
          creator: '@roma_cinema',
          accent: 'Roma • Espressivo',
          contextName: '🎬 Chiacchiere da Bar',
          bgTheme: 'from-rose-950 via-zinc-900 to-black',
          targetSentence: "Ti piacerebbe vincere un viaggio alle Maldive? Eh, magari!",
          translations: {
            en: 'Would you like to win a trip to the Maldives? Ah, I wish!',
            es: '¿Te gustaría ganar un viaje a las Maldivas? ¡Eh, ojalá!',
            pt: 'Você gostaria de ganhar uma viagem paras as Maldivas? Ah, quem me dera!',
            de: 'Möchtest du eine Reise auf die Malediven gewinnen? Schön wäre es!'
          }
        }
      ]
    }
  ],
  de: [
    {
      word: 'Fernweh',
      phonetic: '/ˈfɛʁnveː/',
      dictionaryMeaning: {
        en: 'A longing for far-off places; wanderlust opposite of homesickness',
        es: 'Deseo ferviente de viajar a lugares lejanos',
        pt: 'Desejo intenso de viajar para lugares distantes',
        it: 'Forte desiderio di viaggiare in luoghi lontani'
      },
      slangContext: 'Literal translation: "Far-sickness".',
      clips: [
        {
          id: 'de_f1',
          creator: '@alpen_adventure',
          accent: 'Deutschland • Deutsch',
          contextName: '🏔️ Hiking Vlog',
          bgTheme: 'from-cyan-950 via-slate-900 to-black',
          targetSentence: "Wenn ich mir alte Reisefotos ansehe, bekomme ich sofort riesiges Fernweh.",
          translations: {
            en: 'When I look at old travel photos, I immediately get intense wanderlust.',
            es: 'Cuando miro fotos antiguas de viajes, siento un deseo enorme de viajar.',
            pt: 'Quando olho fotos antigas de viagens, sinto uma saudade enorme de viajar.',
            it: 'Quando guardo le vecchie foto di viaggio, mi viene subito una gran voglia di partire.'
          }
        }
      ]
    },
    {
      word: 'Feierabend',
      phonetic: '/ˈfaɪ̯ɐˌʔaːbənt/',
      dictionaryMeaning: {
        en: 'Closing time / end of the working day',
        es: 'Momento de terminar la jornada laboral y descansar',
        pt: 'Fim do expediente de trabalho',
        it: 'Fine della giornata lavorativa'
      },
      slangContext: 'Crucial German work-life balance concept.',
      clips: [
        {
          id: 'de_fa1',
          creator: '@berlin_gamer',
          accent: 'Berlin • Entspannt',
          contextName: '🎮 Friday Stream',
          bgTheme: 'from-indigo-950 via-purple-950 to-black',
          targetSentence: "Endlich Freitag um 17 Uhr! Jetzt machen wir erst mal gemütlich Feierabend.",
          translations: {
            en: 'Finally Friday at 5 PM! Now we can comfortably enjoy closing time.',
            es: '¡Al fin viernes a las 5 PM! Ahora vamos a disfrutar del fin de la jornada.',
            pt: 'Finalmente sexta-feira às 17h! Agora vamos curtir o fim do expediente.',
            it: 'Finalmente venerdì alle 17! Ora godiamoci il fine giornata.'
          }
        }
      ]
    }
  ]
};

export default function useWordClips(
  targetLang,
  uiLang
) {
  const [wordLists, setWordLists] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const listKey = `${targetLang}:${uiLang}`;
  const sampleWords = useMemo(() => {
    const languageWords = SAMPLE_DATABASE[targetLang] || SAMPLE_DATABASE.en;
    return languageWords.map((word) => ({ ...word, clips: [] }));
  }, [targetLang]);
  const wordList = wordLists[listKey] || sampleWords;

  const setWordList = useCallback((update) => {
    setWordLists((current) => {
      const currentWords = current[listKey] || sampleWords;
      const nextWords = typeof update === 'function' ? update(currentWords) : update;
      return { ...current, [listKey]: nextWords };
    });
  }, [listKey, sampleWords]);

  const loadWordClips = useCallback(async (word, signal) => {
    if (!word) return;

    setIsLoading(true);
    setError('');

    try {
      const clips = await getClips({ word, targetLang, uiLang, signal });
      const playableClips = clips.filter((clip) => /^[\w-]{11}$/.test(clip.videoId || ''));
      if (playableClips.length === 0) {
        throw new Error(`No se encontraron videos reproducibles para "${word}".`);
      }

      setWordList((current) => current.map((item) => (
        item.word === word ? { ...item, clips: playableClips } : item
      )));
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [setWordList, targetLang, uiLang]);

  return { wordList, setWordList, isLoading, error, loadWordClips };
}
