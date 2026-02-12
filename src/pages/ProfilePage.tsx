import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useData';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
    companyName: z.string().optional(),
    companyCnpj: z.string().optional(),
    logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { profileQuery, updateProfile } = useProfile();
    const { toast } = useToast();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            companyName: '',
            companyCnpj: '',
            logoUrl: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (profileQuery.data) {
            form.reset({
                companyName: profileQuery.data.companyName ?? '',
                companyCnpj: profileQuery.data.companyCnpj ?? '',
                logoUrl: profileQuery.data.logoUrl ?? '',
                phone: profileQuery.data.phone ?? '',
            });
        }
    }, [profileQuery.data, form]);

    function onSubmit(data: ProfileFormValues) {
        updateProfile.mutate(data, {
            onSuccess: () => {
                toast({
                    title: "Perfil atualizado",
                    description: "As informações da sua empresa foram salvas.",
                });
            },
            onError: (error) => {
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar",
                    description: error.message || "Tente novamente mais tarde.",
                });
            },
        });
    }

    if (profileQuery.isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (profileQuery.isError) {
        return (
            <div className="flex justify-center items-center h-full text-destructive">
                Erro ao carregar perfil. Tente recarregar a página.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Meu Perfil"
                description="Gerencie seus dados e informações da empresa."
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Usuário</CardTitle>
                        <CardDescription>Informações da sua conta (somente leitura).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input value={profileQuery.data?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Documento (CPF/CNPJ)</Label>
                            <Input value={profileQuery.data?.document || ''} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Empresa</CardTitle>
                        <CardDescription>Essas informações aparecerão nos relatórios e notas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Empresa / Fantasia</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Minha Empresa Ltda" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="companyCnpj"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CNPJ da Empresa</FormLabel>
                                            <FormControl>
                                                <Input placeholder="00.000.000/0001-00" {...field} />
                                            </FormControl>
                                            <FormDescription>Se diferente do documento pessoal.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone / WhatsApp</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(11) 99999-9999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL do Logo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                            </FormControl>
                                            <FormDescription>Link direto para a imagem do seu logo.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={updateProfile.isPending}>
                                    {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Alterações
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
