import * as yup from 'yup';
import { ExpiryTerm } from "../contants/ExpiryTerm";
import { handleError } from "../handlers/handleError";

const linkSchema = yup.object().shape({
    originalUrl: yup.string()
        .url("This is not a valid URL")
        .required("URL is required"),
    expiryPeriod: yup.mixed()
        .oneOf(Object.values(ExpiryTerm), "Invalid expiry period")
        .required("Expiry period is required"),
});

export async function validateLink(originalUrl: string, expiryPeriod: ExpiryTerm) {
    try {
        await linkSchema.validate({
            originalUrl,
            expiryPeriod
        });
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            handleError(error.message);
        } else {
            handleError('An unknown error has occurred (in validateLink)');
        }
    }
}
