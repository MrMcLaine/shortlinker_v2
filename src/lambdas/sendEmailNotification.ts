import { SQSEvent } from 'aws-lambda';
import { emailService } from '../services/emailService';

export const handler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        console.log('Processing record:', record);
        const { linkId, userEmail } = JSON.parse(record.body);

        console.log('linkId', linkId);
        console.log('userEmail', userEmail);
        console.log('event', event);

        await emailService.sendEmail(
            userEmail,
            'Your link has been deactivated',
            `Your link with ID ${linkId} has been deactivated`
        );

        console.log('Email sent');
    }
};
