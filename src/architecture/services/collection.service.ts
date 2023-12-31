import { Character, Collection } from "../../db/models/domain/Tables";
import getDateFormat from "../../util/setDateFormat";
import CollectionRepository from "../repositories/collection.repository";

class BookService {
    collectionRepository: CollectionRepository;

    constructor() {
        this.collectionRepository = new CollectionRepository(
            Collection,
            Character,
        );
    }

    getCollection = async (userId: number) => {
        const userCollection =
            await this.collectionRepository.findOneCollectionByUserId(userId);

        if (userCollection === null) return [];

        return JSON.parse(userCollection.contents);
    };

    updateCollection = async (userId: number) => {
        let EVENT_CHARACTER_ID = 13;

        const userCollection =
            await this.collectionRepository.findOneCollectionByUserId(userId);

        if (userCollection === null)
            throw new Error(
                "Bad Request : 아직 첫 캐릭터를 얻지 않았습니다. 확인이 필요합니다.",
            );

        let collectionContents = JSON.parse(userCollection.contents);

        const validation = collectionContents.findIndex(
            (content: any) => content.characterId === EVENT_CHARACTER_ID,
        );

        if (validation !== -1)
            throw new Error(
                "Bad Request : 이미 이벤트 캐릭터를 획득하였습니다.",
            );

        const eventCharacter =
            await this.collectionRepository.findEventCharacter(
                EVENT_CHARACTER_ID,
            );

        const today = getDateFormat(new Date());

        const updateCharacter = eventCharacter.map((character: any) => {
            character.getDate = today;
            return character;
        });

        const updateCollection =
            await this.collectionRepository.updateCollection(
                userId,
                JSON.stringify([...collectionContents, ...updateCharacter]),
            );

        if (!updateCollection)
            throw new Error(
                "Server Error : 업데이트에 실패하였습니다. 다시 시도해주세요.",
            );

        return eventCharacter;
    };
}

export default BookService;
