import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";

const sesRegion = process.env.AWS_REGION!;
const sesClient = new SESClient({ region: sesRegion } as any);

class EmailService {
    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        const senderEmail = process.env.SENDER_EMAIL! || 'lypovskyi@gmail.com';
        const params = {
            Source: senderEmail,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Text: { Data: body }
                }
            }
        };

        try {
            const command = new SendEmailCommand(params);
            const response = await sesClient.send(command);
            console.log('Email sent to', to, 'response:', response);
        } catch (error) {
            console.error('Error sending email', error);
            throw error;
        }
    }

    async verifyEmail(email: string): Promise<void> {
        const command = new VerifyEmailIdentityCommand({
            EmailAddress: email,
        });

        try {
            await sesClient.send(command);
            console.log('Email verified:', email);
        } catch (error) {
            console.error('Error verifying email', error);
            throw error;
        }
    }
}

export const emailService = new EmailService();
