'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Scissors, User, Phone, MessageCircle, Bell, Check, X, Menu, Settings, Plus, Trash2, Crown, Sparkles, Zap, TrendingUp, Star, Shield, ChevronRight, Users, BarChart3, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  professional: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
  description?: string;
}

interface ProfessionalService {
  serviceId: string;
  customDuration?: number; // Duração personalizada para este profissional
  customPrice?: string; // Preço personalizado para este profissional
}

interface Professional {
  id: string;
  name: string;
  type: 'barber' | 'hairdresser';
  availableHours: string[];
  services: ProfessionalService[]; // Agora com configurações personalizadas
}

interface Subscription {
  plan: 'free' | 'basic' | 'premium' | 'annual';
  startDate: string;
  endDate: string;
  active: boolean;
}

const DEFAULT_SERVICES: Service[] = [
  { id: 'corte-masculino', name: 'Corte Masculino', duration: 30, price: 'R$ 35,00', description: 'Corte tradicional ou moderno' },
  { id: 'barba', name: 'Barba', duration: 20, price: 'R$ 25,00', description: 'Aparar e modelar barba' },
  { id: 'combo', name: 'Corte + Barba', duration: 50, price: 'R$ 55,00', description: 'Combo completo' },
  { id: 'corte-feminino', name: 'Corte Feminino', duration: 45, price: 'R$ 60,00', description: 'Corte e finalização' },
  { id: 'escova', name: 'Escova', duration: 40, price: 'R$ 50,00', description: 'Escova modeladora' },
  { id: 'hidratacao', name: 'Hidratação', duration: 60, price: 'R$ 80,00', description: 'Tratamento capilar' },
];

const DEFAULT_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const ALL_POSSIBLE_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const PLANS = [
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 27,
    period: 'mês',
    icon: Zap,
    color: 'from-blue-500 to-cyan-600',
    features: [
      'Até 2 profissionais',
      'Agendamentos ilimitados',
      'Confirmação via WhatsApp',
      'Lembretes automáticos',
      'Suporte por email',
      'Painel de estatísticas básico'
    ]
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    price: 90,
    period: 'mês',
    icon: Crown,
    color: 'from-purple-500 to-pink-600',
    popular: true,
    features: [
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Confirmação via WhatsApp',
      'Lembretes automáticos',
      'Suporte prioritário 24/7',
      'Painel avançado com relatórios',
      'Personalização completa',
      'Sistema de fidelidade',
      'Integração com redes sociais',
      'Backup automático na nuvem'
    ]
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    price: 900,
    period: 'ano',
    icon: Star,
    color: 'from-amber-500 to-orange-600',
    discount: '2 meses grátis',
    features: [
      'Todos os recursos Premium',
      'Economia de R$ 180/ano',
      'Suporte VIP dedicado',
      'Treinamento personalizado',
      'Consultoria de marketing',
      'Atualizações prioritárias',
      'Domínio personalizado',
      'App mobile exclusivo'
    ]
  }
];

export default function BarberShopWebsite() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showPlans, setShowPlans] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Professional management states
  const [newProfessionalName, setNewProfessionalName] = useState<string>('');
  const [newProfessionalType, setNewProfessionalType] = useState<'barber' | 'hairdresser'>('barber');
  const [editingProfessional, setEditingProfessional] = useState<string | null>(null);
  const [tempHours, setTempHours] = useState<string[]>([]);
  const [tempServices, setTempServices] = useState<ProfessionalService[]>([]);

  // Service management states
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('30');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState<string>('');

  // Load data from localStorage
  useEffect(() => {
    const storedAppointments = localStorage.getItem('barber-appointments');
    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }

    const storedProfessionals = localStorage.getItem('professionals');
    if (storedProfessionals) {
      const loaded = JSON.parse(storedProfessionals);
      // Migrar dados antigos se necessário
      const migrated = loaded.map((p: any) => ({
        ...p,
        services: Array.isArray(p.services) && p.services.length > 0 && typeof p.services[0] === 'string'
          ? p.services.map((sid: string) => ({ serviceId: sid }))
          : p.services
      }));
      setProfessionals(migrated);
    } else {
      const defaultProfessional: Professional = {
        id: '1',
        name: 'Profissional Principal',
        type: 'barber',
        availableHours: DEFAULT_HOURS,
        services: DEFAULT_SERVICES.map(s => ({ serviceId: s.id }))
      };
      setProfessionals([defaultProfessional]);
      localStorage.setItem('professionals', JSON.stringify([defaultProfessional]));
    }

    const storedServices = localStorage.getItem('services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    } else {
      localStorage.setItem('services', JSON.stringify(DEFAULT_SERVICES));
    }

    const storedSubscription = localStorage.getItem('subscription');
    if (storedSubscription) {
      const sub = JSON.parse(storedSubscription);
      if (new Date(sub.endDate) > new Date()) {
        setSubscription(sub);
      } else {
        setSubscription(null);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      localStorage.setItem('barber-appointments', JSON.stringify(appointments));
    }
  }, [appointments]);

  useEffect(() => {
    if (professionals.length > 0) {
      localStorage.setItem('professionals', JSON.stringify(professionals));
    }
  }, [professionals]);

  useEffect(() => {
    if (services.length > 0) {
      localStorage.setItem('services', JSON.stringify(services));
    }
  }, [services]);

  useEffect(() => {
    if (subscription) {
      localStorage.setItem('subscription', JSON.stringify(subscription));
    }
  }, [subscription]);

  const canAddProfessional = (): boolean => {
    if (!subscription) return false;
    if (subscription.plan === 'basic') return professionals.length < 2;
    return true;
  };

  const selectPlan = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    const startDate = new Date();
    const endDate = new Date();
    
    if (planId === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const newSubscription: Subscription = {
      plan: planId as 'basic' | 'premium' | 'annual',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      active: true
    };

    setSubscription(newSubscription);
    setShowPlans(false);
    setActiveTab('app');
    toast.success(`Plano ${plan.name} ativado com sucesso! 🎉`, {
      description: `Válido até ${endDate.toLocaleDateString('pt-BR')}`
    });
  };

  const getProfessionalServiceInfo = (professionalId: string, serviceId: string) => {
    const professional = professionals.find(p => p.id === professionalId);
    const service = services.find(s => s.id === serviceId);
    if (!professional || !service) return null;

    const profService = professional.services.find(ps => ps.serviceId === serviceId);
    if (!profService) return null;

    return {
      name: service.name,
      duration: profService.customDuration || service.duration,
      price: profService.customPrice || service.price,
      description: service.description
    };
  };

  const isTimeAvailable = (date: string, time: string, professionalId: string): boolean => {
    return !appointments.some(
      apt => apt.date === date && apt.time === time && apt.professional === professionalId && apt.status !== 'cancelled'
    );
  };

  const handleBooking = () => {
    if (!subscription) {
      toast.error('Você precisa assinar um plano para agendar');
      setShowPlans(true);
      return;
    }

    if (!clientName || !clientPhone || !selectedService || !selectedDate || !selectedTime || !selectedProfessional) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (!isTimeAvailable(selectedDate, selectedTime, selectedProfessional)) {
      toast.error('Este horário já está reservado para este profissional');
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      professional: selectedProfessional,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setAppointments([...appointments, newAppointment]);
    
    setClientName('');
    setClientPhone('');
    setSelectedService('');
    setSelectedTime('');
    setSelectedProfessional('');

    toast.success('Agendamento realizado com sucesso!');
  };

  const confirmAppointment = (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    setAppointments(appointments.map(a => 
      a.id === id ? { ...a, status: 'confirmed' } : a
    ));

    const serviceInfo = getProfessionalServiceInfo(apt.professional, apt.service);
    const professional = professionals.find(p => p.id === apt.professional);
    
    if (!serviceInfo || !professional) return;

    const message = encodeURIComponent(
      `✅ *Agendamento Confirmado*\n\n` +
      `Olá ${apt.clientName}!\n\n` +
      `Seu agendamento foi confirmado:\n` +
      `📅 Data: ${new Date(apt.date).toLocaleDateString('pt-BR')}\n` +
      `⏰ Horário: ${apt.time}\n` +
      `✂️ Serviço: ${serviceInfo.name}\n` +
      `👤 Profissional: ${professional.name}\n` +
      `⏱️ Duração: ${serviceInfo.duration} min\n` +
      `💰 Valor: ${serviceInfo.price}\n\n` +
      `Aguardamos você! 💈`
    );
    
    window.open(`https://wa.me/55${apt.clientPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
    toast.success('Confirmação enviada via WhatsApp');
  };

  const cancelAppointment = (id: string) => {
    setAppointments(appointments.map(a => 
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));
    toast.info('Agendamento cancelado');
  };

  const getAvailableHours = () => {
    if (!selectedProfessional) return [];
    const professional = professionals.find(p => p.id === selectedProfessional);
    if (!professional) return [];
    
    return professional.availableHours.filter(hour => 
      isTimeAvailable(selectedDate, hour, selectedProfessional)
    );
  };

  const addProfessional = () => {
    if (!canAddProfessional()) {
      toast.error('Upgrade para Premium para adicionar mais profissionais');
      setShowPlans(true);
      return;
    }

    if (!newProfessionalName.trim()) {
      toast.error('Digite o nome do profissional');
      return;
    }

    const newProfessional: Professional = {
      id: Date.now().toString(),
      name: newProfessionalName,
      type: newProfessionalType,
      availableHours: DEFAULT_HOURS,
      services: services.map(s => ({ serviceId: s.id }))
    };

    setProfessionals([...professionals, newProfessional]);
    setNewProfessionalName('');
    toast.success('Profissional adicionado com sucesso!');
  };

  const deleteProfessional = (id: string) => {
    if (professionals.length === 1) {
      toast.error('Você precisa ter pelo menos um profissional');
      return;
    }

    setProfessionals(professionals.filter(p => p.id !== id));
    toast.success('Profissional removido');
  };

  const startEditingProfessional = (professionalId: string) => {
    const professional = professionals.find(p => p.id === professionalId);
    if (professional) {
      setEditingProfessional(professionalId);
      setTempHours([...professional.availableHours]);
      setTempServices([...professional.services]);
    }
  };

  const toggleHour = (hour: string) => {
    if (tempHours.includes(hour)) {
      setTempHours(tempHours.filter(h => h !== hour));
    } else {
      setTempHours([...tempHours, hour].sort());
    }
  };

  const toggleService = (serviceId: string) => {
    const exists = tempServices.find(ps => ps.serviceId === serviceId);
    if (exists) {
      setTempServices(tempServices.filter(ps => ps.serviceId !== serviceId));
    } else {
      setTempServices([...tempServices, { serviceId }]);
    }
  };

  const updateServiceCustomization = (serviceId: string, field: 'duration' | 'price', value: string) => {
    setTempServices(tempServices.map(ps => {
      if (ps.serviceId === serviceId) {
        if (field === 'duration') {
          const duration = parseInt(value);
          return { ...ps, customDuration: isNaN(duration) ? undefined : duration };
        } else {
          return { ...ps, customPrice: value || undefined };
        }
      }
      return ps;
    }));
  };

  const saveProfessionalSettings = () => {
    if (!editingProfessional) return;

    if (tempHours.length === 0) {
      toast.error('Selecione pelo menos um horário');
      return;
    }

    if (tempServices.length === 0) {
      toast.error('Selecione pelo menos um serviço');
      return;
    }

    setProfessionals(professionals.map(p => 
      p.id === editingProfessional 
        ? { ...p, availableHours: tempHours, services: tempServices } 
        : p
    ));

    setEditingProfessional(null);
    setTempHours([]);
    setTempServices([]);
    toast.success('Configurações atualizadas com sucesso!');
  };

  const cancelEditingProfessional = () => {
    setEditingProfessional(null);
    setTempHours([]);
    setTempServices([]);
  };

  // Service management functions
  const addService = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) {
      toast.error('Preencha nome e preço do serviço');
      return;
    }

    const duration = parseInt(newServiceDuration);
    if (isNaN(duration) || duration <= 0) {
      toast.error('Duração deve ser um número válido');
      return;
    }

    const newService: Service = {
      id: Date.now().toString(),
      name: newServiceName,
      duration: duration,
      price: newServicePrice,
      description: newServiceDescription
    };

    setServices([...services, newService]);
    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('');
    setNewServiceDescription('');
    toast.success('Serviço adicionado com sucesso!');
  };

  const deleteService = (id: string) => {
    if (services.length === 1) {
      toast.error('Você precisa ter pelo menos um serviço');
      return;
    }

    setServices(services.filter(s => s.id !== id));
    // Remove service from all professionals
    setProfessionals(professionals.map(p => ({
      ...p,
      services: p.services.filter(ps => ps.serviceId !== id)
    })));
    toast.success('Serviço removido');
  };

  const startEditingService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setEditingService(serviceId);
      setNewServiceName(service.name);
      setNewServiceDuration(service.duration.toString());
      setNewServicePrice(service.price);
      setNewServiceDescription(service.description || '');
    }
  };

  const saveServiceEdit = () => {
    if (!editingService) return;

    if (!newServiceName.trim() || !newServicePrice.trim()) {
      toast.error('Preencha nome e preço do serviço');
      return;
    }

    const duration = parseInt(newServiceDuration);
    if (isNaN(duration) || duration <= 0) {
      toast.error('Duração deve ser um número válido');
      return;
    }

    setServices(services.map(s => 
      s.id === editingService 
        ? {
            ...s,
            name: newServiceName,
            duration: duration,
            price: newServicePrice,
            description: newServiceDescription
          }
        : s
    ));

    setEditingService(null);
    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('');
    setNewServiceDescription('');
    toast.success('Serviço atualizado com sucesso!');
  };

  const cancelEditingService = () => {
    setEditingService(null);
    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('');
    setNewServiceDescription('');
  };

  // Home Page
  if (activeTab === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Toaster position="top-center" />
        
        {/* Navigation */}
        <nav className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">BarberPro</span>
              </div>
              
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-white/80 hover:text-white transition-colors">Recursos</a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Planos</a>
                <a href="#testimonials" className="text-white/80 hover:text-white transition-colors">Depoimentos</a>
                <Button 
                  onClick={() => setActiveTab('pricing')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Começar Agora
                </Button>
              </div>

              <button 
                className="md:hidden text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {isMenuOpen && (
              <div className="md:hidden py-4 space-y-4">
                <a href="#features" className="block text-white/80 hover:text-white">Recursos</a>
                <a href="#pricing" className="block text-white/80 hover:text-white">Planos</a>
                <a href="#testimonials" className="block text-white/80 hover:text-white">Depoimentos</a>
                <Button 
                  onClick={() => setActiveTab('pricing')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  Começar Agora
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 font-medium">Sistema Profissional de Agendamentos</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Transforme sua <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Barbearia</span> em um Negócio Digital
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Gerencie agendamentos, reduza faltas e aumente seu faturamento com tecnologia de ponta. Tudo em um só lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setActiveTab('pricing')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg px-8 py-6"
              >
                Começar Gratuitamente
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Ver Demonstração
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-slate-400">Estabelecimentos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">50k+</div>
                <div className="text-slate-400">Agendamentos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">4.9★</div>
                <div className="text-slate-400">Avaliação</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-black/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Recursos que <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Fazem a Diferença</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar sua barbearia ou salão de forma profissional
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Agendamento Online</h3>
                  <p className="text-slate-300">Seus clientes agendam pelo WhatsApp ou site, sem complicação</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Bell className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Lembretes Automáticos</h3>
                  <p className="text-slate-300">Reduza faltas com lembretes via WhatsApp 24h antes</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Múltiplos Profissionais</h3>
                  <p className="text-slate-300">Gerencie horários individuais para cada barbeiro ou cabeleireira</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Relatórios Completos</h3>
                  <p className="text-slate-300">Acompanhe seu faturamento e performance em tempo real</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">WhatsApp Integrado</h3>
                  <p className="text-slate-300">Confirmações e lembretes direto no WhatsApp do cliente</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Dados Seguros</h3>
                  <p className="text-slate-300">Backup automático na nuvem, seus dados sempre protegidos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                O que dizem nossos <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Clientes</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4">
                    "Reduzi as faltas em 70%! Os lembretes automáticos fazem toda diferença. Recomendo demais!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600" />
                    <div>
                      <div className="font-semibold text-white">Carlos Silva</div>
                      <div className="text-sm text-slate-400">Barbearia Elite</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4">
                    "Sistema muito fácil de usar. Meus clientes adoram agendar pelo WhatsApp. Profissional demais!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600" />
                    <div>
                      <div className="font-semibold text-white">Rafael Santos</div>
                      <div className="text-sm text-slate-400">Barber Shop Premium</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4">
                    "Aumentei meu faturamento em 40% no primeiro mês. O sistema é incrível e o suporte é top!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                    <div>
                      <div className="font-semibold text-white">Marcelo Costa</div>
                      <div className="text-sm text-slate-400">Barbearia Moderna</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para Transformar seu Negócio?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de estabelecimentos que já aumentaram seu faturamento com o BarberPro
            </p>
            <Button 
              size="lg"
              onClick={() => setActiveTab('pricing')}
              className="bg-white text-purple-600 hover:bg-slate-100 text-lg px-8 py-6"
            >
              Começar Agora - É Grátis
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/40 backdrop-blur-sm py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">BarberPro</span>
                </div>
                <p className="text-slate-400">Sistema profissional de agendamentos para barbearias e salões</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-4">Produto</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Planos</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Demonstração</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Empresa</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Suporte</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-slate-400">
              <p>© 2024 BarberPro. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Pricing Page
  if (activeTab === 'pricing' || showPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Toaster position="top-center" />
        
        {/* Navigation */}
        <nav className="bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <button 
                onClick={() => { setActiveTab('home'); setShowPlans(false); }}
                className="flex items-center gap-3"
              >
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">BarberPro</span>
              </button>
              
              <Button 
                variant="ghost"
                onClick={() => { setActiveTab('home'); setShowPlans(false); }}
                className="text-white hover:bg-white/10"
              >
                Voltar
              </Button>
            </div>
          </div>
        </nav>

        {/* Pricing Header */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 font-medium">Sistema Profissional de Agendamentos</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Escolha seu <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Plano Ideal</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Transforme seu negócio com tecnologia de ponta. Mais clientes, menos trabalho manual.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aumente seu Faturamento</h3>
                <p className="text-slate-300">Reduza faltas e otimize sua agenda com lembretes automáticos</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Experiência Premium</h3>
                <p className="text-slate-300">Impressione seus clientes com tecnologia profissional</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Dados Seguros</h3>
                <p className="text-slate-300">Backup automático e segurança de nível empresarial</p>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    plan.popular 
                      ? 'border-4 border-purple-500 shadow-2xl shadow-purple-500/50' 
                      : 'border-slate-700'
                  } bg-slate-800/50 backdrop-blur-sm`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 text-sm font-bold">
                      MAIS POPULAR
                    </div>
                  )}
                  
                  {plan.discount && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 text-xs font-bold">
                      {plan.discount}
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-12">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-white">R$ {plan.price}</span>
                      <span className="text-slate-400">/{plan.period}</span>
                    </div>
                    {plan.id === 'annual' && (
                      <p className="text-sm text-emerald-400 mt-2">Equivale a R$ 75/mês</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-slate-300">
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => selectPlan(plan.id)}
                      className={`w-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${plan.color} hover:opacity-90`}
                    >
                      Começar Agora
                    </Button>

                    <p className="text-center text-xs text-slate-400">
                      Cancele quando quiser • Sem taxas ocultas
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-6">Mais de 500 estabelecimentos já confiam no BarberPro</p>
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Star className="w-5 h-5 text-amber-400" />
                <span>Avaliação 4.9/5</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // App Dashboard (existing functionality)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3"
            >
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Scissors className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">BarberPro</h1>
                <p className="text-sm text-blue-200">Sistema de Agendamentos</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              {subscription && (
                <Badge className={`bg-gradient-to-r ${
                  subscription.plan === 'annual' ? 'from-amber-500 to-orange-600' :
                  subscription.plan === 'premium' ? 'from-purple-500 to-pink-600' :
                  'from-blue-500 to-cyan-600'
                } text-white border-0 px-4 py-2`}>
                  <Crown className="w-4 h-4 mr-2" />
                  {subscription.plan === 'annual' ? 'Anual' :
                   subscription.plan === 'premium' ? 'Premium' : 'Básico'}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPlans(true)}
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Hoje</p>
                  <p className="text-3xl font-bold">{appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length}</p>
                </div>
                <Calendar className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Confirmados</p>
                  <p className="text-3xl font-bold">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </p>
                </div>
                <Check className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pendentes</p>
                  <p className="text-3xl font-bold">
                    {appointments.filter(a => a.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px] bg-white shadow-md">
            <TabsTrigger value="agendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Agendar
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="profissionais" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Profissionais
            </TabsTrigger>
            <TabsTrigger value="servicos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Scissors className="w-4 h-4 mr-2" />
              Serviços
            </TabsTrigger>
          </TabsList>

          {/* New Appointment Tab */}
          <TabsContent value="agendar" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Novo Agendamento
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Preencha os dados para agendar um horário
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4" />
                      Nome do Cliente
                    </Label>
                    <Input
                      id="name"
                      placeholder="Digite o nome completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4" />
                      Telefone (WhatsApp)
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    Selecione o Profissional
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {professionals.map(professional => (
                      <Card
                        key={professional.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          selectedProfessional === professional.id
                            ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500'
                            : 'hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedProfessional(professional.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-slate-800">{professional.name}</p>
                              <Badge variant="secondary" className={professional.type === 'hairdresser' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}>
                                {professional.type === 'hairdresser' ? 'Cabeleireira' : 'Barbeiro'}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="bg-slate-100">
                              {professional.availableHours.length}h
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Scissors className="w-4 h-4" />
                    Selecione o Serviço
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services
                      .filter(service => {
                        if (!selectedProfessional) return true;
                        const professional = professionals.find(p => p.id === selectedProfessional);
                        
                        // Filtrar por tipo de profissional
                        const femaleServices = ['corte-feminino', 'escova', 'hidratacao'];
                        const maleServices = ['corte-masculino', 'barba', 'combo'];
                        
                        if (professional?.type === 'hairdresser') {
                          // Cabeleireira: apenas serviços femininos
                          if (!femaleServices.includes(service.id)) return false;
                        } else if (professional?.type === 'barber') {
                          // Barbeiro: apenas serviços masculinos
                          if (!maleServices.includes(service.id)) return false;
                        }
                        
                        return professional?.services.some(ps => ps.serviceId === service.id);
                      })
                      .map(service => {
                        const serviceInfo = selectedProfessional 
                          ? getProfessionalServiceInfo(selectedProfessional, service.id)
                          : { name: service.name, duration: service.duration, price: service.price, description: service.description };
                        
                        if (!serviceInfo) return null;

                        return (
                          <Card
                            key={service.id}
                            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                              selectedService === service.id
                                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500'
                                : 'hover:border-blue-300'
                            }`}
                            onClick={() => setSelectedService(service.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-800">{serviceInfo.name}</p>
                                  {serviceInfo.description && (
                                    <p className="text-xs text-slate-600 mt-1">{serviceInfo.description}</p>
                                  )}
                                  <p className="text-sm text-slate-600 mt-1">{serviceInfo.duration} min</p>
                                </div>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                  {serviceInfo.price}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4" />
                    Data
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {selectedDate && selectedProfessional && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4" />
                      Horário Disponível
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {getAvailableHours().map(hour => (
                        <Button
                          key={hour}
                          variant={selectedTime === hour ? 'default' : 'outline'}
                          className={`${
                            selectedTime === hour
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                              : 'hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          onClick={() => setSelectedTime(hour)}
                        >
                          {hour}
                        </Button>
                      ))}
                    </div>
                    {getAvailableHours().length === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Não há horários disponíveis para este profissional nesta data
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar Agendamento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments List Tab */}
          <TabsContent value="agendamentos" className="space-y-4">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Próximos Agendamentos
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Gerencie seus agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {appointments.filter(a => a.date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled').length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">Nenhum agendamento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments
                      .filter(a => a.date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled')
                      .sort((a, b) => {
                        const dateA = new Date(`${a.date}T${a.time}`);
                        const dateB = new Date(`${b.date}T${b.time}`);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map(apt => {
                        const serviceInfo = getProfessionalServiceInfo(apt.professional, apt.service);
                        const professional = professionals.find(p => p.id === apt.professional);
                        return (
                          <Card key={apt.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-600" />
                                    <span className="font-semibold text-slate-800">{apt.clientName}</span>
                                    <Badge
                                      variant={
                                        apt.status === 'confirmed' ? 'default' :
                                        apt.status === 'pending' ? 'secondary' : 'destructive'
                                      }
                                      className={
                                        apt.status === 'confirmed' ? 'bg-emerald-500' :
                                        apt.status === 'pending' ? 'bg-amber-500' : ''
                                      }
                                    >
                                      {apt.status === 'confirmed' ? 'Confirmado' :
                                       apt.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {new Date(apt.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {apt.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {professional?.name || 'Profissional não encontrado'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Scissors className="w-4 h-4" />
                                      {serviceInfo?.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-4 h-4" />
                                      {apt.clientPhone}
                                    </span>
                                  </div>
                                </div>
                                
                                {apt.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => confirmAppointment(apt.id)}
                                      className="bg-emerald-500 hover:bg-emerald-600"
                                    >
                                      <MessageCircle className="w-4 h-4 mr-1" />
                                      Confirmar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => cancelAppointment(apt.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professionals Management Tab */}
          <TabsContent value="profissionais" className="space-y-4">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gerenciar Profissionais
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Adicione barbeiros e cabeleireiras e configure horários, serviços e preços individuais
                  {subscription?.plan === 'basic' && (
                    <span className="block mt-2 text-amber-200">
                      Plano Básico: Máximo 2 profissionais
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Nome do profissional"
                    value={newProfessionalName}
                    onChange={(e) => setNewProfessionalName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addProfessional()}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={newProfessionalType === 'barber' ? 'default' : 'outline'}
                      onClick={() => setNewProfessionalType('barber')}
                      className={newProfessionalType === 'barber' ? 'bg-blue-500' : ''}
                    >
                      Barbeiro
                    </Button>
                    <Button
                      variant={newProfessionalType === 'hairdresser' ? 'default' : 'outline'}
                      onClick={() => setNewProfessionalType('hairdresser')}
                      className={newProfessionalType === 'hairdresser' ? 'bg-pink-500' : ''}
                    >
                      Cabeleireira
                    </Button>
                  </div>
                  <Button onClick={addProfessional} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-4">
                  {professionals.map(professional => (
                    <Card key={professional.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-slate-800">{professional.name}</h3>
                                <Badge className={professional.type === 'hairdresser' ? 'bg-pink-500' : 'bg-blue-500'}>
                                  {professional.type === 'hairdresser' ? 'Cabeleireira' : 'Barbeiro'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {professional.availableHours.length} horários • {professional.services.length} serviços
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {editingProfessional !== professional.id && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditingProfessional(professional.id)}
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Settings className="w-4 h-4 mr-1" />
                                    Configurar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteProfessional(professional.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {editingProfessional === professional.id ? (
                            <div className="space-y-6 pt-4 border-t">
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                                  Horários de trabalho:
                                </Label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                  {ALL_POSSIBLE_HOURS.map(hour => (
                                    <Button
                                      key={hour}
                                      size="sm"
                                      variant={tempHours.includes(hour) ? 'default' : 'outline'}
                                      className={`${
                                        tempHours.includes(hour)
                                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                                          : 'hover:border-purple-400 hover:bg-purple-50'
                                      }`}
                                      onClick={() => toggleHour(hour)}
                                    >
                                      {hour}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                                  Serviços oferecidos (personalize duração e preço):
                                </Label>
                                <div className="space-y-3">
                                  {services.map(service => {
                                    const isSelected = tempServices.some(ps => ps.serviceId === service.id);
                                    const profService = tempServices.find(ps => ps.serviceId === service.id);
                                    
                                    return (
                                      <Card key={service.id} className={`${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}>
                                        <CardContent className="p-3">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <Button
                                                size="sm"
                                                variant={isSelected ? 'default' : 'outline'}
                                                className={`${
                                                  isSelected
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                    : ''
                                                }`}
                                                onClick={() => toggleService(service.id)}
                                              >
                                                <Check className={`w-4 h-4 mr-2 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                                {service.name}
                                              </Button>
                                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>Padrão: {service.duration}min • {service.price}</span>
                                              </div>
                                            </div>
                                            
                                            {isSelected && (
                                              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                                <div>
                                                  <Label className="text-xs text-slate-600">Duração (min)</Label>
                                                  <Input
                                                    type="number"
                                                    placeholder={service.duration.toString()}
                                                    value={profService?.customDuration || ''}
                                                    onChange={(e) => updateServiceCustomization(service.id, 'duration', e.target.value)}
                                                    className="h-8 text-sm"
                                                  />
                                                </div>
                                                <div>
                                                  <Label className="text-xs text-slate-600">Preço</Label>
                                                  <Input
                                                    placeholder={service.price}
                                                    value={profService?.customPrice || ''}
                                                    onChange={(e) => updateServiceCustomization(service.id, 'price', e.target.value)}
                                                    className="h-8 text-sm"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={cancelEditingProfessional}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={saveProfessionalSettings}
                                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                >
                                  <Save className="w-4 h-4 mr-2" />
                                  Salvar Configurações
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 space-y-2">
                              <div>
                                <p className="text-xs text-slate-500 mb-2">Horários:</p>
                                <div className="flex flex-wrap gap-1">
                                  {professional.availableHours.slice(0, 8).map(hour => (
                                    <Badge key={hour} variant="secondary" className="bg-purple-100 text-purple-700">
                                      {hour}
                                    </Badge>
                                  ))}
                                  {professional.availableHours.length > 8 && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                      +{professional.availableHours.length - 8}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-2">Serviços:</p>
                                <div className="flex flex-wrap gap-1">
                                  {professional.services.slice(0, 4).map(profService => {
                                    const service = services.find(s => s.id === profService.serviceId);
                                    if (!service) return null;
                                    
                                    const hasCustom = profService.customDuration || profService.customPrice;
                                    return (
                                      <Badge key={profService.serviceId} variant="secondary" className={hasCustom ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                                        {service.name}
                                        {hasCustom && ' ⚙️'}
                                      </Badge>
                                    );
                                  })}
                                  {professional.services.length > 4 && (
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                      +{professional.services.length - 4}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Management Tab */}
          <TabsContent value="servicos" className="space-y-4">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Gerenciar Serviços
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Adicione e edite serviços, estilos de cortes e preços padrão
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-slate-800">
                      {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serviceName">Nome do Serviço</Label>
                        <Input
                          id="serviceName"
                          placeholder="Ex: Corte Degradê"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="servicePrice">Preço</Label>
                        <Input
                          id="servicePrice"
                          placeholder="R$ 00,00"
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceDuration">Duração (minutos)</Label>
                        <Input
                          id="serviceDuration"
                          type="number"
                          placeholder="30"
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="serviceDescription">Descrição (opcional)</Label>
                        <Input
                          id="serviceDescription"
                          placeholder="Ex: Corte moderno com degradê"
                          value={newServiceDescription}
                          onChange={(e) => setNewServiceDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingService ? (
                        <>
                          <Button onClick={saveServiceEdit} className="bg-emerald-500 hover:bg-emerald-600">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                          </Button>
                          <Button variant="outline" onClick={cancelEditingService}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button onClick={addService} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Serviço
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800">Serviços Cadastrados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(service => (
                      <Card key={service.id} className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                              )}
                              <div className="flex gap-3 mt-2">
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                  {service.price}
                                </Badge>
                                <Badge variant="outline">
                                  {service.duration} min
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingService(service.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteService(service.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            © 2024 BarberPro - Sistema de Agendamentos Profissional
          </p>
        </div>
      </footer>
    </div>
  );
}
