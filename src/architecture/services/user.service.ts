import axios from "axios";
import UserRepository from "../repositories/user.repository";
import userRepository from "../repositories/user.repository";
import getDateFormat from "../../util/setDateFormat";

const signInKakao = async (kakaoToken: String) => {
    const result = await axios.get("https://kapi.kakao.com/v2/user/me", {
        headers: {
            Authorization: `Bearer ${kakaoToken}`,
        },
    });

    const { data } = result;

    let email: String = data.kakao_account.email;
    const nickName: String = data.properties.nickname;
    const imageUrl: String = data.properties.profile_image;

    if (!email || !nickName) throw new Error("KEY_ERROR");

    //DB 유저 정보 찾기
    const userData = await UserRepository.getUserByEmail(email);

    //DB에 유저 정보가 없을 경우 유저 정보 등록
    if (!userData) {
        //회원 가입
        await UserRepository.signUp(email, nickName, imageUrl);
        //DB 유저 정보 찾기
        const userData = await UserRepository.getUserByEmail(email);

        const collection: object | any = await userRepository.getCollection(
            <number>userData?.userId,
        );

        let obj = {
            userId: userData?.userId,
            email: userData?.email,
            nickName: userData?.nickName,
            imageUrl: userData?.imageUrl,
            character: collection,
        };
        return obj;
    }

    return userData;
};

const findGuestData = async () => {
    return UserRepository.findUserById(1);
};

const getPlanBySuccess = async (
    userId: number,
    page: number,
    scale: number,
) => {
    const getPlanBySuccess = await userRepository.getPlanBySuccess(
        userId,
        page,
        scale,
    );

    const bookList = getPlanBySuccess.rows.map((plan: any) => {
        return {
            planId: plan.planId,
            startDate: plan.startDate,
            endDate: plan.endDate,
            bookId: plan["Book.bookId"],
            title: plan["Book.title"],
            author: plan["Book.author"],
            pubDate: plan["Book.pubDate"],
            description: plan["Book.description"],
            coverImage: plan["Book.coverImage"],
            isbn: plan["Book.isbn"],
            publisher: plan["Book.publisher"],
            totalPage: plan["Book.totalPage"],
        };
    });

    return {
        totalCount: getPlanBySuccess.count,
        totalPage: Math.ceil(getPlanBySuccess.count / scale),
        bookList,
    };
};

const restorePlan = async (userId: number, planId: number) => {
    const findOnePlanById = await userRepository.findOnePlanById(
        userId,
        planId,
    );

    if (findOnePlanById === null)
        throw new Error("Not Found : 플랜을 찾을 수 없습니다.");
    if (findOnePlanById.status !== "delete")
        throw new Error("Bad Request : 삭제 되지 않은 플랜입니다.");

    let status = "inProgress";

    if (findOnePlanById.endDate < new Date(getDateFormat(new Date())))
        status = "failed";

    const restorePlan = await userRepository.restorePlan(
        userId,
        planId,
        status,
    );

    if (!restorePlan)
        throw new Error(
            "Server Error : 복구에 실패하였습니다. 다시 시도해주세요.",
        );
};

const findPlanByDelete = async (userId: number) => {
    const findPlanByDelete = await userRepository.findPlanByDelete(userId);

    return findPlanByDelete.map((plan: any) => {
        return {
            planId: plan.planId,
            planStatus: plan.status,
            startDate: plan.startDate,
            endDate: plan.endDate,
            currentPage: plan.currentPage,
            totalPage: plan.totalPage,
            bookId: plan["Book.bookId"],
            title: plan["Book.title"],
            author: plan["Book.author"],
            publisher: plan["Book.publisher"],
            description: plan["Book.description"],
            coverImage: plan["Book.coverImage"],
            isbn: plan["Book.isbn"],
        };
    });
};

const userSecession = async (userId: number) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    //삭제할 계정의 이메일 명 랜덤으로 생성하여 넣을 변수
    let Remail: String = "";
    const charactersLength = characters.length;
    let num: number = 5;
    //A~z까지 랜덤한 문자 5개를 Remail에 담는다
    for (let i = 0; i < num; i++) {
        Remail += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
    }
    //랜덤한 문자 + userId (혹시 모를 중복값을 대비하여 추가)
    Remail += userId.toString();
    return await userRepository.userSecession(userId, Remail);
};

const planValidation = async (userId: number) => {
    return await userRepository.planValidation(userId);
};

const bookValidation = async (isbn: string, userId: number) => {
    const bookData = await userRepository.findBookByIsbn(isbn);
    if (bookData === null) return false;

    return await userRepository.bookValidation(Number(bookData.bookId), userId);
};

const getUserInfo = async (userId: number) => {
    return userRepository.findUserById(userId);
};

export default {
    signInKakao,
    findGuestData,
    getPlanBySuccess,
    restorePlan,
    findPlanByDelete,
    userSecession,
    planValidation,
    bookValidation,
    getUserInfo,
};
