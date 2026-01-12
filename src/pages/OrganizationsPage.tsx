import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Organization } from '@/types';
import { toast } from 'sonner';

export default function OrganizationsPage() {
  const { organizations, addOrganization, updateOrganization, deleteOrganization } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ name: '', cnpj: '', email: '', phone: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingOrg) {
      updateOrganization(editingOrg.id, formData);
      toast.success('Organização atualizada!');
    } else {
      addOrganization(formData);
      toast.success('Organização criada!');
    }

    setFormData({ name: '', cnpj: '', email: '', phone: '' });
    setEditingOrg(null);
    setIsOpen(false);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      cnpj: org.cnpj || '',
      email: org.email || '',
      phone: org.phone || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta organização? Todos os projetos e tarefas relacionados serão excluídos.')) {
      deleteOrganization(id);
      toast.success('Organização excluída!');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingOrg(null);
      setFormData({ name: '', cnpj: '', email: '', phone: '' });
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Organizações"
        description="Gerencie seus clientes e empresas"
        action={
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingOrg ? 'Editar Organização' : 'Nova Organização'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrg
                      ? 'Atualize os dados da organização.'
                      : 'Adicione uma nova organização para seus projetos.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da organização"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingOrg ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {organizations.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="Nenhuma organização"
          description="Comece adicionando sua primeira organização para gerenciar seus clientes."
          action={
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Organização
            </Button>
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-header">Nome</TableHead>
                <TableHead className="table-header">CNPJ</TableHead>
                <TableHead className="table-header">E-mail</TableHead>
                <TableHead className="table-header">Telefone</TableHead>
                <TableHead className="table-header w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">{org.cnpj || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{org.email || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{org.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(org)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(org.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
