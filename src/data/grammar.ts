import type { GrammarPattern, TranslationPair } from '../types';

// 37 A1 grammar / pattern entries. nodeIds are filled in by buildCourse from
// each node's grammarIds (reverse map), so they are left empty here.

const ex = (pairs: [string, string][]): TranslationPair[] =>
  pairs.map(([target, native]) => ({ target, native }));

const g = (
  id: string,
  title: string,
  explanation: string,
  pattern: string,
  examples: [string, string][],
  commonMistake: string,
): GrammarPattern => ({ id, title, explanation, pattern, examples: ex(examples), commonMistake, nodeIds: [] });

export const grammar: GrammarPattern[] = [
  g('subject-pronouns', 'Subject pronouns',
    'Spanish often drops the subject because the verb ending already shows who is speaking. Use the pronoun for contrast or clarity.',
    'yo / tú / usted / él / ella / nosotros / ellos',
    [['Yo soy de México.', 'I am from Mexico.'], ['¿Tú hablas inglés?', 'Do you speak English?'], ['Ella es profesora.', 'She is a teacher.']],
    'Do not add "yo" to every sentence. "Yo soy, yo tengo, yo voy" sounds unnatural.'),

  g('ser', 'ser (to be: identity)',
    'Use ser for names, origin, jobs, and permanent traits.',
    'soy / eres / es / somos / son',
    [['Soy turista.', 'I am a tourist.'], ['Es de España.', 'He is from Spain.'], ['Somos amigos.', 'We are friends.']],
    'Do not use ser for location. "Soy en el hotel" is wrong; use estar.'),

  g('estar', 'estar (to be: location and state)',
    'Use estar for location and temporary states like tired or open/closed.',
    'estoy / estás / está / estamos / están',
    [['Estoy en el hotel.', 'I am at the hotel.'], ['¿Dónde está el baño?', 'Where is the bathroom?'], ['La tienda está cerrada.', 'The shop is closed.']],
    'Do not use estar for origin. "Estoy de Canadá" is wrong; use soy de.'),

  g('ser-vs-estar', 'ser vs estar',
    'ser = who/what something is. estar = where it is or how it is right now.',
    'ser → identity · estar → place / state',
    [['Soy María.', 'I am María.'], ['Estoy en Madrid.', 'I am in Madrid.'], ['Está bien.', 'It is fine.']],
    'Mixing them: "Estoy profesor" (wrong) vs "Soy profesor" (correct).'),

  g('llamarse', 'llamarse (to be called)',
    'Use llamarse to give names. Literally "I call myself".',
    'me llamo / te llamas / se llama',
    [['Me llamo Ana.', 'My name is Ana.'], ['¿Cómo te llamas?', 'What is your name?'], ['Se llama Luis.', 'His name is Luis.']],
    'Do not drop the reflexive part. "Llamo Ana" is wrong; say "me llamo Ana".'),

  g('tener', 'tener (to have)',
    'Use tener for possession and for age, hunger, and thirst.',
    'tengo / tienes / tiene / tenemos / tienen',
    [['Tengo una reserva.', 'I have a reservation.'], ['Tengo treinta años.', 'I am thirty years old.'], ['¿Tienes hambre?', 'Are you hungry?']],
    'For age use tener, not ser. "Soy treinta años" is wrong; say "tengo treinta años".'),

  g('hay', 'hay (there is / there are)',
    'hay is one fixed word for both singular and plural. Use it to say something exists.',
    'hay + [noun]',
    [['Hay un banco aquí.', 'There is a bank here.'], ['¿Hay un baño?', 'Is there a bathroom?'], ['Hay muchos turistas.', 'There are many tourists.']],
    'hay never changes. "Han dos hoteles" is wrong; say "hay dos hoteles".'),

  g('gustar', 'gustar (to like)',
    'gustar works backwards: the thing liked is the subject. Use gusta for one thing, gustan for several.',
    'me/te/le gusta + [singular] · gustan + [plural]',
    [['Me gusta el café.', 'I like coffee.'], ['No me gustan las cebollas.', 'I do not like onions.'], ['¿Te gusta la paella?', 'Do you like paella?']],
    'Do not say "Yo gusto el café". Say "me gusta el café".'),

  g('querer', 'querer (to want)',
    'Use quiero for wants. Use the polite form quisiera (I would like) when ordering or requesting.',
    'quiero / quieres / quiere · quisiera (polite)',
    [['Quiero un café.', 'I want a coffee.'], ['Quisiera la cuenta.', 'I would like the bill.'], ['¿Quieres agua?', 'Do you want water?']],
    'In shops, prefer quisiera over quiero; quiero alone can sound blunt.'),

  g('necesitar', 'necesitar (to need)',
    'Use necesitar plus a noun or a verb in the infinitive.',
    'necesito + [noun / infinitive]',
    [['Necesito ayuda.', 'I need help.'], ['Necesito un taxi.', 'I need a taxi.'], ['Necesito cambiar dinero.', 'I need to change money.']],
    'Keep the second verb in the infinitive: "Necesito hablo" is wrong; say "necesito hablar".'),

  g('poder', 'poder (can / to be able)',
    'Use poder plus an infinitive to ask if something is possible or to make polite requests.',
    'puedo / puedes / puede + [infinitive]',
    [['¿Puede ayudarme?', 'Can you help me?'], ['¿Puedo pagar con tarjeta?', 'Can I pay by card?'], ['No puedo comer gluten.', 'I cannot eat gluten.']],
    'The verb after poder stays in the infinitive: "puedo ayudo" is wrong.'),

  g('ir', 'ir (to go)',
    'ir is irregular. Use a (to) for the destination, and al for "to the" before a masculine noun.',
    'voy / vas / va + a + [place]',
    [['Voy al aeropuerto.', 'I am going to the airport.'], ['¿Vas a la estación?', 'Are you going to the station?'], ['Vamos al centro.', 'We are going downtown.']],
    'Remember a + el = al. "Voy a el banco" is wrong; say "voy al banco".'),

  g('ir-a-inf', 'ir a + infinitive (near future)',
    'Use ir a plus an infinitive to talk about plans, like "going to" in English.',
    'voy a + [infinitive]',
    [['Voy a comer ahora.', 'I am going to eat now.'], ['Vamos a visitar el museo.', 'We are going to visit the museum.'], ['¿Vas a viajar mañana?', 'Are you going to travel tomorrow?']],
    'Do not forget the "a": "voy comer" is wrong; say "voy a comer".'),

  g('ar-verbs', 'Regular -ar verbs',
    'Drop -ar and add the endings. This covers hablar, trabajar, viajar, comprar and many more.',
    'hablo / hablas / habla / hablamos / hablan',
    [['Hablo un poco de español.', 'I speak a little Spanish.'], ['Trabajamos en Madrid.', 'We work in Madrid.'], ['¿Compras el billete?', 'Are you buying the ticket?']],
    'Do not use the English -ing form. "Estoy hablo" is wrong; say "hablo" or "estoy hablando".'),

  g('er-verbs', 'Regular -er verbs',
    'Drop -er and add the endings. Covers comer, beber, leer, comprender.',
    'como / comes / come / comemos / comen',
    [['Como pescado.', 'I eat fish.'], ['¿Bebes agua?', 'Do you drink water?'], ['No comprendo.', 'I do not understand.']],
    'Endings differ from -ar verbs in the vowel: it is -emos, not -amos.'),

  g('ir-verbs', 'Regular -ir verbs',
    'Drop -ir and add the endings. Covers vivir, escribir, abrir.',
    'vivo / vives / vive / vivimos / viven',
    [['Vivo en Canadá.', 'I live in Canada.'], ['¿Dónde vives?', 'Where do you live?'], ['Escribimos un mensaje.', 'We write a message.']],
    'The nosotros form is -imos (vivimos), not -emos.'),

  g('question-words', 'Question words',
    'Common question words carry a written accent. The verb usually comes right after.',
    'qué / quién / dónde / cuándo / cómo / cuánto / por qué',
    [['¿Dónde está el hotel?', 'Where is the hotel?'], ['¿Cuánto cuesta?', 'How much does it cost?'], ['¿Cómo te llamas?', 'What is your name?']],
    'Use the opening "¿" and keep the accent: dónde, not donde, in questions.'),

  g('gender', 'Noun gender',
    'Nouns are masculine or feminine. Most -o words are masculine, most -a words are feminine.',
    'el / un + masculine · la / una + feminine',
    [['el vuelo', 'the flight'], ['la maleta', 'the suitcase'], ['un café', 'a coffee']],
    'Some -a words are masculine (el problema, el día). Learn these as exceptions.'),

  g('plurals', 'Plural nouns',
    'Add -s after a vowel and -es after a consonant. Articles also become plural.',
    '[noun] + s / es · los / las',
    [['los hoteles', 'the hotels'], ['las llaves', 'the keys'], ['dos cafés', 'two coffees']],
    'Words ending in -z change to -ces: luz → luces.'),

  g('definite-articles', 'Definite articles (the)',
    'Use el, la, los, las for "the". They must match the noun in gender and number.',
    'el / la / los / las',
    [['el banco', 'the bank'], ['la estación', 'the station'], ['los días', 'the days']],
    'Match gender: "la problema" is wrong; it is "el problema".'),

  g('indefinite-articles', 'Indefinite articles (a / some)',
    'Use un, una for "a" and unos, unas for "some".',
    'un / una / unos / unas',
    [['un billete', 'a ticket'], ['una habitación', 'a room'], ['unas preguntas', 'some questions']],
    'Drop the article for jobs after ser: "Soy un profesor" is usually just "soy profesor".'),

  g('adjective-agreement', 'Adjective agreement',
    'Adjectives match the noun in gender and number and usually come after it.',
    '[noun] + [adjective + gender/number]',
    [['un café pequeño', 'a small coffee'], ['una maleta pequeña', 'a small suitcase'], ['las camas grandes', 'the big beds']],
    'Put the adjective after the noun: "rojo coche" is wrong; say "coche rojo".'),

  g('negation', 'Negation',
    'Put no directly before the verb. Double negatives are normal in Spanish.',
    'no + [verb] · no ... nada / nunca',
    [['No hablo francés.', 'I do not speak French.'], ['No hay problema.', 'There is no problem.'], ['No quiero nada.', 'I do not want anything.']],
    'Keep no before the verb: "Hablo no" is wrong; say "no hablo".'),

  g('word-order', 'Basic word order',
    'Default order is subject, verb, object, but the subject is often dropped. Questions can keep the same order with rising tone.',
    '[subject] + verb + object',
    [['Quiero un café.', 'I want a coffee.'], ['María tiene dos hijos.', 'María has two children.'], ['¿Hablas español?', 'Do you speak Spanish?']],
    'You do not need "do/does" for questions: "¿Haces tú...?" not "¿Do you...?".'),

  g('present-basics', 'Present tense basics',
    'The simple present covers both "I eat" and "I am eating", and habitual actions.',
    'regular endings: -o / -as,-es / -a,-e',
    [['Trabajo en un hotel.', 'I work in a hotel.'], ['Viajo mucho.', 'I travel a lot.'], ['Como a las dos.', 'I eat at two.']],
    'Do not overuse estar + -ando; the simple present is usually enough.'),

  g('prep-location', 'Prepositions of place',
    'Common location words: en, al lado de, cerca de, lejos de, enfrente de, a la derecha/izquierda.',
    'está + [preposition] + [place]',
    [['El banco está cerca.', 'The bank is near.'], ['Está al lado del museo.', 'It is next to the museum.'], ['Está a la derecha.', 'It is on the right.']],
    'Remember de + el = del: "al lado de el museo" → "al lado del museo".'),

  g('connectors', 'Basic connectors',
    'Join ideas with y (and), pero (but), porque (because), también (also), o (or).',
    '... y / pero / porque / también ...',
    [['Quiero café y agua.', 'I want coffee and water.'], ['Es pequeño pero bonito.', 'It is small but nice.'], ['No voy porque estoy cansado.', 'I am not going because I am tired.']],
    'y becomes e before words starting with i: "español e inglés".'),

  g('polite-requests', 'Polite requests',
    'Soften requests with quisiera, por favor, and ¿podría/puede...?',
    'Quisiera ... / ¿Puede ...? + por favor',
    [['Quisiera un té, por favor.', 'I would like a tea, please.'], ['¿Puede repetir, por favor?', 'Can you repeat, please?'], ['Perdón, ¿dónde está...?', 'Excuse me, where is...?']],
    'Add por favor and perdón; bare commands can sound rude to strangers.'),

  g('numbers-agreement', 'Numbers and agreement',
    'uno becomes un before a masculine noun and una before a feminine noun. cien is 100; ciento for 101+.',
    'un / una · veintiún · cien / ciento',
    [['un euro', 'one euro'], ['una habitación', 'one room'], ['cien euros', 'one hundred euros']],
    'Use cien for exactly 100: "ciento" is for 101 and up (ciento uno).'),

  g('telling-time', 'Telling the time',
    'Use es la una for one o\'clock and son las for the rest. Add y for minutes past and menos for to.',
    'Es la una · Son las [n] y/menos [min]',
    [['Son las tres.', 'It is three o\'clock.'], ['Es la una y media.', 'It is half past one.'], ['Son las dos menos cuarto.', 'It is a quarter to two.']],
    'Only one o\'clock uses "es la"; everything else uses "son las".'),

  g('possessives', 'Possessives (my, your)',
    'mi, tu, su do not change for gender but add -s for plural nouns.',
    'mi / tu / su · mis / tus / sus',
    [['mi familia', 'my family'], ['tu nombre', 'your name'], ['sus hijos', 'his/her children']],
    'Match number, not gender: it is "mis hermanos", not "mios hermanos".'),

  g('demonstratives', 'this / that',
    'Use este/esta for "this" and ese/esa for "that". They match the noun.',
    'este / esta · ese / esa',
    [['este abrigo', 'this coat'], ['esa camisa', 'that shirt'], ['estos zapatos', 'these shoes']],
    'Match gender: "este camisa" is wrong; say "esta camisa".'),

  g('muy-vs-mucho', 'muy vs mucho',
    'muy means "very" and goes before adjectives. mucho means "a lot" and works with nouns or verbs.',
    'muy + [adjective] · mucho/-a/-os/-as + [noun]',
    [['Es muy caro.', 'It is very expensive.'], ['Hay mucha gente.', 'There are a lot of people.'], ['Gracias, muy amable.', 'Thank you, very kind.']],
    'Do not say "muy mucho". Use one or the other.'),

  g('contractions', 'al and del',
    'a + el contracts to al, and de + el contracts to del. No other contractions exist.',
    'a + el = al · de + el = del',
    [['Voy al mercado.', 'I am going to the market.'], ['Cerca del hotel.', 'Near the hotel.'], ['Al lado del banco.', 'Next to the bank.']],
    'Only el contracts: "a la" and "de la" stay separate.'),

  g('por-para-basic', 'por and para (basics)',
    'For A1: use para to mean "for" a person or purpose, and por in fixed phrases like por favor.',
    'para + [person/purpose] · por (fixed phrases)',
    [['Es para mí.', 'It is for me.'], ['Una mesa para dos.', 'A table for two.'], ['Por favor.', 'Please.']],
    'Do not stress over the full rule yet; learn common phrases first.'),

  g('frequency-adverbs', 'Frequency words',
    'Words like siempre, normalmente, a veces, nunca say how often. They usually go before the verb or at the start.',
    'siempre / normalmente / a veces / nunca + [verb]',
    [['Siempre tomo café.', 'I always have coffee.'], ['A veces voy al gimnasio.', 'Sometimes I go to the gym.'], ['Nunca como carne.', 'I never eat meat.']],
    'With nunca before the verb you do not add another "no": "nunca como", not "no nunca como".'),
];
