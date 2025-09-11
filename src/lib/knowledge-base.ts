
export interface KnowledgeUnit {
    id: string;
    title: string;
    vocabulary: string[];
    sentencePatterns: string[];
    subContent?: {
        title: string;
        vocabulary: string[];
        sentencePatterns: string[];
    }[];
}

export interface Curriculum {
    id: string;
    name: string;
    units: KnowledgeUnit[];
}

export const KNOWLEDGE_BASES: Curriculum[] = [
    {
        id: "i-learn-smart-start-5",
        name: "Tiếng Anh 5 i-Learn Smart Start",
        units: [
            {
                id: "unit1",
                title: "Unit 1: SCHOOL",
                vocabulary: [
                    "geography", "history", "science", "I.T.", "Vietnamese", "ethics",
                    "solving problems", "doing experiments", "making things", "using computers",
                    "reading stories", "learning languages", "always", "usually", "often",
                    "sometimes", "rarely", "never", "a.m.", "p.m.", "eight o'clock", "two-thirty",
                    "a quarter to four", "five past nine"
                ],
                sentencePatterns: [
                    "Which subject do you like? - I like science.",
                    "Which subject does he like? - He likes English.",
                    "Why do you like math? - Because I like solving problems.",
                    "I always use computers in I.T. class.",
                    "What time does your English class start? - It starts at eight o'clock."
                ],
            },
            {
                id: "unit2",
                title: "Unit 2: HOLIDAYS",
                vocabulary: [
                    "Halloween", "New Year's Eve", "Lunar New Year", "Christmas", "Teachers' Day", "Children's Day",
                    "first", "second", "third", "fourth", "fifth",
                    "put up colored paper", "buy candy", "invite friends", "blow up the balloons", "make a cake", "wrap the presents",
                    "put up a Christmas tree", "give presents", "watch fireworks", "wear costumes", "give lucky money", "watch the lion dance"
                ],
                sentencePatterns: [
                    "What's your favorite holiday? - It's Halloween.",
                    "When's Christmas Day? - It's on December twenty-fifth.",
                    "Could you blow up the balloons? - Yes, sure.",
                    "What do people do to celebrate Christmas? - They put up a Christmas tree."
                ],
            },
            {
                id: "unit3",
                title: "Unit 3: MY FRIENDS AND I",
                vocabulary: [
                    "slowly", "fast", "badly", "well", "hard",
                    "noisy", "quiet", "busy", "delicious", "yucky", "scary",
                    "bake cupcakes", "paint a picture", "plant some flowers", "visit my grandparents", "stay at home", "study",
                    "have a sleepover", "go camping", "have a barbecue", "sing karaoke", "go bowling", "make paper crafts"
                ],
                sentencePatterns: [
                    "Tom kicks the ball hard.",
                    "Where were you last night? - I was at the movie theater. The movie was scary.",
                    "I planted some flowers yesterday.",
                    "I went camping last week."
                ],
            },
            {
                id: "unit4",
                title: "Unit 4: TRAVEL",
                vocabulary: [
                    "mountain", "lake", "river", "beach", "ocean", "forest",
                    "Canada", "France", "South Korea", "Brazil", "Germany", "Spain",
                    "ferry", "minibus", "plane", "helicopter", "van", "speedboat"
                ],
                sentencePatterns: [
                    "I didn't go to the river. I went to the beach.",
                    "I went to South Korea last month. Did you sing karaoke? - Yes, I did./No, I didn't.",
                    "How did you get there? - We went by helicopter."
                ],
            },
            {
                id: "unit5",
                title: "Unit 5: HEALTH",
                vocabulary: [
                    "the flu", "chickenpox", "a toothache", "a stomachache", "a headache", "an earache",
                    "terrible", "sleepy", "weak", "sick", "sore", "stuffed up",
                    "see a dentist", "take some medicine", "get some rest", "stay up late", "take a bath", "skip breakfast"
                ],
                sentencePatterns: [
                    "What's wrong? - I have a stomachache.",
                    "How do you feel? - I feel weak. That's too bad.",
                    "You should see a dentist.",
                    "You shouldn't stay up late."
                ],
            },
            {
                id: "unit6",
                title: "Unit 6: FOOD AND DRINKS",
                vocabulary: [
                    "soda", "smoothie", "tea", "lemonade", "juice", "hot chocolate",
                    "hamburger", "sandwich", "steak", "pie", "rice", "curry",
                    "breakfast", "lunch", "dinner", "bread", "meat", "cereal"
                ],
                sentencePatterns: [
                    "I need a little butter.",
                    "Let's make smoothies. - OK. I'll bring milk.",
                    "Will you bring hamburgers? - Yes, I will.",
                    "Will you bring pie? - No, I won't."
                ],
            },
            {
                id: "unit7",
                title: "Unit 7: JOBS",
                vocabulary: [
                    "scientist", "pilot", "tour guide", "business person", "hairdresser", "designer",
                    "soccer player", "singer", "nurse", "driver", "police officer", "actor",
                    "engineer", "biologist", "vet", "astronaut", "mechanic", "chemist"
                ],
                sentencePatterns: [
                    "What would you like to be when you grow up? - I'd like to be a scientist.",
                    "I think he'll be a soccer player.",
                    "What jobs will people do in the future? - I think many people will be engineers."
                ],
            },
            {
                id: "unit8",
                title: "Unit 8: WEATHER",
                vocabulary: [
                    "tonight", "tomorrow", "tomorrow morning", "next week", "next Wednesday", "next weekend",
                    "humid", "dry", "calm", "breezy", "clear", "gray",
                    "snowstorm", "thunderstorm", "rainstorm", "flood", "sunshine", "shower",
                    "spring", "summer", "fall", "winter"
                ],
                sentencePatterns: [
                    "I'm going to visit the beach tomorrow. I hope the weather is sunny.",
                    "It's humid today. Oh, then I'm going to visit the water park.",
                    "There will be some showers, so I'm going to bring my umbrella.",
                    "What's the weather like in Melbourne in the summer? - It's warm and dry."
                ],
            }
        ]
    }
    // Add other curriculums here in the future
];

export const getCumulativeKnowledge = (curriculumId: string, unitId: string): { vocabulary: string[], sentencePatterns: string[] } => {
    const curriculum = KNOWLEDGE_BASES.find(kb => kb.id === curriculumId);
    if (!curriculum) {
        return { vocabulary: [], sentencePatterns: [] };
    }

    const unitIndex = curriculum.units.findIndex(unit => unit.id === unitId);
    if (unitIndex === -1) {
        return { vocabulary: [], sentencePatterns: [] };
    }

    const relevantUnits = curriculum.units.slice(0, unitIndex + 1);
    
    const vocabulary = relevantUnits.flatMap(unit => unit.vocabulary);
    const sentencePatterns = relevantUnits.flatMap(unit => unit.sentencePatterns);

    return {
        vocabulary: [...new Set(vocabulary)], // Remove duplicates
        sentencePatterns: [...new Set(sentencePatterns)]
    };
};

export const getCurrentUnitKnowledge = (curriculumId: string, unitId: string): KnowledgeUnit | undefined => {
    const curriculum = KNOWLEDGE_BASES.find(kb => kb.id === curriculumId);
    if (!curriculum) {
        return undefined;
    }
    return curriculum.units.find(unit => unit.id === unitId);
}
