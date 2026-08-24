import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserRound, Car, Pencil, Plus, Save, X, AlertTriangle, Upload, Trash2 } from 'lucide-react';

type CustomerFlag = 'Excelente cliente' | 'Normal' | 'Atenção' | 'Mal pagador' | 'Problemático';

interface CustomerVehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: string | null;
}

interface CustomerRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  photo_url: string | null;
  customer_flag: CustomerFlag;
  active: boolean;
  vehicles: CustomerVehicle[];
}

interface CustomersViewProps {
  companyId: string;
}

const FLAGS: CustomerFlag[] = [
  'Excelente cliente',
  'Normal',
  'Atenção',
  'Mal pagador',
  'Problemático',
];

export const CustomersView: React.FC<CustomersViewProps> = ({ companyId }) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerPhoto, setNewCustomerPhoto] = useState<File | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    notes: '',
    customer_flag: 'Normal' as CustomerFlag,
  });

  const loadCustomers = async () => {
    if (!companyId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        document,
        notes,
        photo_url,
        customer_flag,
        active,
        vehicles(id, plate, brand, model, color, year)
      `)
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name', { ascending: true });

    setLoading(false);

    if (error) {
      console.error('Erro ao carregar clientes.', error);
      setMessage('Não foi possível carregar os clientes.');
      return;
    }

    setCustomers((data ?? []) as CustomerRecord[]);
  };

  useEffect(() => {
    void loadCustomers();
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((customer) => {
      const vehiclesText = (customer.vehicles ?? [])
        .map((v) => `${v.plate} ${v.brand ?? ''} ${v.model ?? ''}`)
        .join(' ')
        .toLowerCase();

      return [
        customer.name,
        customer.phone ?? '',
        customer.email ?? '',
        customer.document ?? '',
        vehiclesText,
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [customers, search]);

  const handleCreateCustomer = async () => {
   if (!companyId || savingNewCustomer) return;
setSavingNewCustomer(true);

    const name = newCustomer.name.trim();
    const phone = newCustomer.phone.trim();
    const email = newCustomer.email.trim();
    const document = newCustomer.document.trim();

    if (!name) {
      setMessage('Informe o nome completo do cliente.');
      setSavingNewCustomer(false);
      return;
    }

    if (phone) {
      const { data: existingByPhone, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('phone', phone)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar telefone duplicado.', error);
        setMessage('Não foi possével verificar se o cliente já existe.');
        setSavingNewCustomer(false);
        return;
      }

      if (existingByPhone) {
        setMessage(`Já existe um cliente ativo com este telefone: ${existingByPhone.name}.`);
        setSavingNewCustomer(false);
        return;
      }
    }

    if (document) {
      const { data: existingByDocument, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('document', document)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar documento duplicado.', error);
        setMessage('Não foi possével verificar se o cliente já existe.');
        setSavingNewCustomer(false);
        return;
      }

      if (existingByDocument) {
        setMessage(`Já existe um cliente ativo com este CPF/CNPJ: ${existingByDocument.name}.`);
        setSavingNewCustomer(false);
        return;
      }
    }

    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        company_id: companyId,
        name,
        phone: phone || null,
        email: email || null,
        document: document || null,
        notes: newCustomer.notes.trim() || null,
        customer_flag: newCustomer.customer_flag,
        active: true,
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('Erro ao cadastrar cliente.', error);
      setMessage('Não foi possével cadastrar o0cliente.');
      setSavingNewCustomer(false);
      return;
    }

    if (newCustomerPhoto) {
      try {
        const compressedPhoto = await compressProfilePhoto(newCustomerPhoto);
        const filePath = `${companyId}/${created.id}/profile-${Date.now()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from('customer-photos')
          .upload(filePath, compressedPhoto, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('customer-photos')
          .getPublicUrl(filePath);

        const { error: photoUpdateError } = await supabase
          .from('customers')
          .update({
            photo_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', created.id)
          .eq('company_id', companyId);

        if (photoUpdateError) throw photoUpdateError;
      } catch (photoError) {
        console.error('Cliente criado, mas houve erro ao salvar a foto.', photoError);
        setMessage('Cliente criado, mas não foi possível salvar a foto.');
      }
    }

    setIsNewCustomerOpen(false);
    setNewCustomerPhoto(null);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      document: '',
      notes: '',
      customer_flag: 'Normal',
    });
    setMessage('Cliente cadastrado com sucesso.');
    setSavingNewCustomer(false);
    await loadCustomers();
  };

  const handleSave = async () => {
    if (!editing || !companyId) return;

    const { error } = await supabase
      .from('customers')
      .update({
        name: editing.name.trim(),
        phone: editing.phone?.trim() || null,
        email: editing.email?.trim() || null,
        document: editing.document?.trim() || null,
        notes: editing.notes?.trim() || null,
        photo_url: editing.photo_url?.trim() || null,
        customer_flag: editing.customer_flag,
        active: editing.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao atualizar cliente.', error);
      setMessage('Não foi possível salvar o cliente.');
      return;
    }

    setMessage('Cliente atualizado com sucesso.');
    setEditing(null);
    await loadCustomers();
  };

  const compressProfilePhoto = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) { bitmap.close(); throw new Error('Não foi possível processar a imagem.'); }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const toBlob = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem.')), 'image/webp', quality);
    });
    let quality = 0.82;
    let compressed = await toBlob(quality);
    while (compressed.size > 500 * 1024 && quality > 0.3) { quality -= 0.08; compressed = await toBlob(quality); }
    if (compressed.size > 500 * 1024) throw new Error('Não foi possível reduzir a foto para até 500 KB.');
    return compressed;
  };

  const handlePhotoUpload = async (file: File) => {
    if (!editing || !companyId) return;
    if (!file.type.startsWith('image/')) { setMessage('Selecione um arquivo de imagem.'); return; }
    setUploadingPhoto(true);
    setMessage(null);
    try {
      const compressedPhoto = await compressProfilePhoto(file);
      const filePath = `${companyId}/${editing.id}/profile-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('customer-photos').upload(filePath, compressedPhoto, { contentType: 'image/webp', cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('customer-photos').getPublicUrl(filePath);
      const photoUrl = data.publicUrl;
      const { error: updateError } = await supabase.from('customers').update({ photo_url: photoUrl, updated_at: new Date().toISOString() }).eq('id', editing.id).eq('company_id', companyId);
      if (updateError) throw updateError;
      setEditing({ ...editing, photo_url: photoUrl });
      setMessage('Foto atualizada com sucesso.');
      await loadCustomers();
    } catch (error) {
      console.error('Erro ao processar foto do cliente.', error);
      setMessage('Não foi possível enviar a foto.');
    } finally { setUploadingPhoto(false); }
  };

  const handleDeleteCustomer = async () => {
    if (!editing || !companyId) return;

    const confirmed = window.confirm(
      `Excluir o perfil de ${editing.name}? O cadastro sairá da lista ativa, mas o histórico de OS e agendamentos será preservado.`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc('deactivate_customer', {
      p_customer_id: editing.id,
    });

    if (error) {
      console.error('Erro ao excluir perfil.', error);
      setMessage('Não foi possível excluir o perfil.');
      return;
    }

    setEditing(null);
    setMergeTargetId('');
    setMessage('Perfil excluído do cadastro ativo. Histórico preservado.');
    await loadCustomers();
  };

  const handleMergeCustomer = async () => {
    if (!editing || !companyId || !mergeTargetId || mergeTargetId === editing.id) return;

    const target = customers.find((customer) => customer.id === mergeTargetId);

    if (!target) {
      setMessage('Cliente de destino não encontrado.');
      return;
    }

    const confirmed = window.confirm(
      `Mesclar "${editing.name}" em "${target.name}"? Veículos, agendamentos e OS serão transferidos para o perfil de destino e este perfil será desativado.`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc('merge_customer', {
      p_source_customer_id: editing.id,
      p_target_customer_id: target.id,
    });

    if (error) {
      console.error('Erro ao mesclar clientes.', error);
      setMessage('Não foi possível concluir a mesclagem. Nenhuma alteração parcial foi mantida.');
      return;
    }

    setEditing(null);
    setMergeTargetId('');
    setMessage(`Clientes mesclados com sucesso em "${target.name}".`);
    await loadCustomers();
  };

  const flagClass = (flag: CustomerFlag) => {
    if (flag === 'Excelente cliente') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (flag === 'Atenção') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (flag === 'Mal pagador') return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    if (flag === 'Problemático') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Clientes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cadastro, veículos, contato, perfil e alertas de atendimento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setNewCustomerPhoto(null);
              setNewCustomer({
                name: '',
                phone: '',
                email: '',
                document: '',
                notes: '',
                customer_flag: 'Normal',
              });
              setIsNewCustomerOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </button>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone, documento ou placa"
            className="w-full bg-[#141c2b] border border-[#23314a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs px-3 py-2 rounded-xl">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400 py-12 text-center">Carregando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[#2a3955] rounded-2xl py-14 text-center text-slate-500 text-sm">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((customer) => (
            <div key={customer.id} className="bg-[#141c2b] border border-[#23314a] rounded-2xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                {customer.photo_url ? (
                  <img
                    src={customer.photo_url}
                    alt={customer.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#30415f] bg-[#0f172a]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
                    <UserRound className="w-6 h-6 text-blue-400" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">{customer.name}</h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${flagClass(customer.customer_flag)}`}>
                      {customer.customer_flag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {customer.phone || 'Sem telefone'} {customer.email ? `• ${customer.email}` : ''}
                  </p>
                  {customer.document && (
                    <p className="text-[11px] text-slate-500 mt-0.5">CPF/CNPJ: {customer.document}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setMessage(null);
                    setEditing({ ...customer, vehicles: [...(customer.vehicles ?? [])] });
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  title="Editar cliente"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {customer.notes && (
                <div className="bg-[#101726] border border-[#202d43] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-400 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Observações
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                  Veículos vinculados
                </div>
                {(customer.vehicles ?? []).length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum veículo vinculado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customer.vehicles.map((vehicle) => (
                      <span
                        key={vehicle.id}
                        className="inline-flex items-center gap-1.5 bg-[#101726] border border-[#263754] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300"
                      >
                        <Car className="w-3.5 h-3.5 text-blue-400" />
                        <strong className="text-white">{vehicle.plate}</strong>
                        {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

     {isNewCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p4">
          <div className="bg-[#141c2b] border border-[#2a3a56] rounded-2xl wfull max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#23314a]">
              <div>
                <h3 className="text-base font-bold text-white">Novo cliente</h3>
                <p className="text-[11px] text-slate-400">
                  Cadastro antecipado para deixar os dados prontos no Supabase.
                </p>
              </div>
              <button onClick={() => setIsNewCustomerOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome completo *</label>
                <input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                <input value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CPF / CNPJ</label>
                <input value={newCustomer.document} onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })} className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Classificação / Alerta</label>
                <select value={newCustomer.customer_flag} onChange={(e) => setNewCustomer({ ...newCustomer, customer_flag: e.target.value as CustomerFlag })} className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white">
                  {FLAGS.map((flag) => (<option key={flag} value={flag}>{flag}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Foto do cliente</label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewCustomerPhoto(e.target.files?.[0] ?? null)} />
                  <span className="w-full inline-flex items-center justify-center gap-2 bg-[#101726] hover:bg-[#182338] border border-[#293a58] rounded-xl px-3 py-2 text-xs font-bold text-slate-200">
                    <Upload className="w-4 h-4 text-blue-400" />
                    {newCustomerPhoto ? newCustomerPhoto.name : 'Selecionar foto'}
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  A foto será reduzida automaticamente para WebP, até 600x600 px e 500 KB.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Observações / Discriminação</label>
                <textarea rows={4} value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} placeholder="Ex: excelente cliente, atenção com prazo, histórico de atraso..." className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white resize-y" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#23314a] flex justify-end gap-2">
              <button type="button" onClick={() => setIsNewCustomerOpen(false)} className="px-4 py-2 rounded-xl border border-[#2a3a56] text-slate-300 text-xs font-bold">Cancelar</button>
              <button type="button" onClick={handleCreateCustomer} disabled={savingNewCustomer} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingNewCustomer ? 'Cadastrando...' : 'Cadastrar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}


$      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141c2b] border border-[#2a3a56] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#23314a]">
              <div>
                <h3 className="text-base font-bold text-white">Editar cliente</h3>
                <p className="text-[11px] text-slate-400">Atualize o perfil central do cliente.</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome completo *</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input
                  value={editing.phone ?? ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail</label>
                <input
                  value={editing.email ?? ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CPF / CNPJ</label>
                <input
                  value={editing.document ?? ''}
                  onChange={(e) => setEditing({ ...editing, document: e.target.value })}
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Classificação / Alerta</label>
                <select
                  value={editing.customer_flag}
                  onChange={(e) => setEditing({ ...editing, customer_flag: e.target.value as CustomerFlag })}
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                >
                  {FLAGS.map((flag) => <option key={flag} value={flag}>{flag}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Foto do cliente</label>
                <div className="flex items-center gap-3">
                  {editing.photo_url ? (
                    <img src={editing.photo_url} alt={editing.name} className="w-14 h-14 rounded-xl object-cover border border-[#30415f]" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0"><UserRound className="w-6 h-6 text-blue-400" /></div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handlePhotoUpload(file); e.currentTarget.value = ''; }} />
                    <span className="w-full inline-flex items-center justify-center gap-2 bg-[#101726] hover:bg-[#182338] border border-[#293a58] rounded-xl px-3 py-2 text-xs font-bold text-slate-200"><Upload className="w-4 h-4 text-blue-400" />{uploadingPhoto ? 'Enviando...' : 'Fazer upload da foto'}</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">Redução automática para até 600×600 px e 500 KB.</p>
              </div>
              <div className="sm:col-span-2 bg-[#101726] border border-[#293a58] rounded-xl p-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">Mesclar cliente duplicado</label>
                <p className="text-[10px] text-slate-500 mb-2">Transfere veículos, agendamentos e OS para outro perfil e desativa este cadastro.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="flex-1 bg-[#141c2b] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Selecione o perfil de destino...</option>
                    {customers.filter((customer) => customer.id !== editing.id).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}{customer.phone ? ` • ${customer.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!mergeTargetId}
                    onClick={handleMergeCustomer}
                    className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 text-xs font-bold"
                  >
                    Mesclar perfis
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Observações / Discriminação</label>
                <textarea
                  rows={4}
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  placeholder="Ex: excelente cliente, exige contato antes de qualquer serviço extra, histórico de atraso..."
                  className="w-full bg-[#101726] border border-[#293a58] rounded-xl px-3 py-2 text-xs text-white resize-y"
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                Cliente ativo
              </label>
            </div>

            <div className="px-5 py-4 border-t border-[#23314a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button onClick={handleDeleteCustomer} className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold inline-flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Excluir perfil</button>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-[#2a3a56] text-slate-300 text-xs font-bold">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2"><Save className="w-4 h-4" />Salvar cliente</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
