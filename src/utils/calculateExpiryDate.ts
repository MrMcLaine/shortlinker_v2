import { ExpiryTerm } from "../contants/ExpiryTerm";

export const calculateExpiryDate = async (expiryTerm: ExpiryTerm): Promise<string> => {
    try {
        const INFINITY_DATE = new Date('9999-12-31T23:59:59.999Z');
        let expiredAt = new Date();
        switch (expiryTerm) {
            case ExpiryTerm.ONCE:
                expiredAt.setDate(INFINITY_DATE.getDate());
                break;
            case ExpiryTerm.ONE_DAY:
                expiredAt.setDate(expiredAt.getDate() + 1);
                break;
            case ExpiryTerm.THREE_DAYS:
                expiredAt.setDate(expiredAt.getDate() + 3);
                break;
            case ExpiryTerm.SEVEN_DAYS:
                expiredAt.setDate(expiredAt.getDate() + 7);
                break;
            case ExpiryTerm.TEST:
                expiredAt = new Date(expiredAt.getTime() + 60 * 1000);
                break;

            default:
                throw new Error('Invalid expiry period');
        }

        expiredAt.setTime(expiredAt.getTime() + 2 * 60 * 60 * 1000);

        return expiredAt.toISOString();
    } catch (error) {
        throw error;
    }
}