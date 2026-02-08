import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'NIT Career Counselling <onboarding@resend.dev>', // Use onboarding@resend.dev for unverified domains
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend Error Details:', JSON.stringify(error, null, 2));
            return { success: false, error };
        }

        console.log('Email sent successfully:', data?.id);

        return { success: true, data };
    } catch (err) {
        console.error('Resend Exception:', err);
        return { success: false, error: err };
    }
}
