import { RegisterFlow } from '@/components/registration/RegisterFlow';

export const metadata = {
    title: 'Register Your Pet | Pets-911',
    description: 'Preparation is better than panic. Register your pet once to ensure faster recovery if they ever go missing.',
};

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-slate-900">
            <RegisterFlow />
        </main>
    );
}
