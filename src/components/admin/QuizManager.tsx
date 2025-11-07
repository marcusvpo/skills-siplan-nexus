import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const QuizManager = () => {
  const [sistemaId, setSistemaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [tipoQuiz, setTipoQuiz] = useState<"aula" | "bronze" | "prata">("aula");
  const [selectedId, setSelectedId] = useState(""); // video_aula_id ou trilha_id
  const [quizAtual, setQuizAtual] = useState<any>(null);
  const [perguntaForm, setPerguntaForm] = useState<any>({
    pergunta: "",
    tipo_pergunta: "multipla_escolha",
    opcoes: [{ id: 1, texto: "" }, { id: 2, texto: "" }],
    resposta_correta: [],
    imagem_url: ""
  });
  const queryClient = useQueryClient();

  const { data: sistemas = [] } = useQuery({
    queryKey: ['sistemas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sistemas').select('*').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos', sistemaId],
    queryFn: async () => {
      if (!sistemaId) return [];
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!sistemaId
  });

  const { data: items = [] } = useQuery({
    queryKey: ['quiz-items', produtoId, tipoQuiz],
    queryFn: async () => {
      if (!produtoId) return [];
      if (tipoQuiz === "aula") {
        const { data, error } = await supabase
          .from('video_aulas')
          .select('*')
          .eq('produto_id', produtoId);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('trilhas')
          .select('*')
          .eq('produto_id', produtoId);
        if (error) throw error;
        return data;
      }
    },
    enabled: !!produtoId
  });

  const { data: quizData } = useQuery({
    queryKey: ['quiz-detail', selectedId, tipoQuiz],
    queryFn: async () => {
      if (!selectedId) return null;
      
      const query = tipoQuiz === "aula"
        ? supabase.from('quizzes').select('*, quiz_perguntas(*)').eq('video_aula_id', selectedId).eq('tipo', 'aula')
        : supabase.from('quizzes').select('*, quiz_perguntas(*)').eq('trilha_id', selectedId).eq('tipo', tipoQuiz);
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      setQuizAtual(data);
      return data;
    },
    enabled: !!selectedId
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = tipoQuiz === "aula" 
        ? { video_aula_id: selectedId, tipo: 'aula', ...data }
        : { trilha_id: selectedId, tipo: tipoQuiz, ...data };
      
      const { data: quiz, error } = await supabase.from('quizzes').insert(payload).select().single();
      if (error) throw error;
      return quiz;
    },
    onSuccess: (quiz) => {
      setQuizAtual(quiz);
      queryClient.invalidateQueries({ queryKey: ['quiz-detail'] });
      toast({ title: "Quiz criado com sucesso!" });
    }
  });

  const addPerguntaMutation = useMutation({
    mutationFn: async (pergunta: any) => {
      const { error } = await supabase.from('quiz_perguntas').insert({
        quiz_id: quizAtual.id,
        ...pergunta
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-detail'] });
      toast({ title: "Pergunta adicionada!" });
      resetPerguntaForm();
    }
  });

  const deletePerguntaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_perguntas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-detail'] });
      toast({ title: "Pergunta removida!" });
    }
  });

  const resetPerguntaForm = () => {
    setPerguntaForm({
      pergunta: "",
      tipo_pergunta: "multipla_escolha",
      opcoes: [{ id: 1, texto: "" }, { id: 2, texto: "" }],
      resposta_correta: [],
      imagem_url: ""
    });
  };

  const addOpcao = () => {
    setPerguntaForm({
      ...perguntaForm,
      opcoes: [...perguntaForm.opcoes, { id: perguntaForm.opcoes.length + 1, texto: "" }]
    });
  };

  const updateOpcao = (index: number, texto: string) => {
    const novasOpcoes = [...perguntaForm.opcoes];
    novasOpcoes[index].texto = texto;
    setPerguntaForm({ ...perguntaForm, opcoes: novasOpcoes });
  };

  const removeOpcao = (index: number) => {
    setPerguntaForm({
      ...perguntaForm,
      opcoes: perguntaForm.opcoes.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestão de Quizzes</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Sistema</Label>
          <Select value={sistemaId} onValueChange={setSistemaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um sistema" />
            </SelectTrigger>
            <SelectContent>
              {sistemas.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Produto</Label>
          <Select value={produtoId} onValueChange={setProdutoId} disabled={!sistemaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {produtos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Quiz</Label>
          <Select value={tipoQuiz} onValueChange={(v: any) => setTipoQuiz(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aula">Quizzes de Aulas</SelectItem>
              <SelectItem value="bronze">Quiz Cert. Bronze</SelectItem>
              <SelectItem value="prata">Quiz Cert. Prata</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {produtoId && (
        <div>
          <Label>{tipoQuiz === "aula" ? "Aulas" : "Trilhas"}</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${tipoQuiz === "aula" ? "uma aula" : "uma trilha"}`} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item: any) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.titulo || item.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedId && !quizAtual && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título do Quiz</Label>
              <Input id="titulo" placeholder="Ex: Quiz de Validação" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qtd. Perguntas a Exibir</Label>
                <Input id="qtd" type="number" defaultValue="3" />
              </div>
              <div>
                <Label>Mínimo de Acertos</Label>
                <Input id="min" type="number" defaultValue="2" />
              </div>
            </div>
            <Button onClick={() => {
              const titulo = (document.getElementById('titulo') as HTMLInputElement).value;
              const qtd = parseInt((document.getElementById('qtd') as HTMLInputElement).value);
              const min = parseInt((document.getElementById('min') as HTMLInputElement).value);
              createQuizMutation.mutate({ titulo, qtd_perguntas_exibir: qtd, min_acertos: min });
            }}>
              Criar Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {quizAtual && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Pergunta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pergunta</Label>
                <Textarea
                  value={perguntaForm.pergunta}
                  onChange={(e) => setPerguntaForm({ ...perguntaForm, pergunta: e.target.value })}
                  placeholder="Digite a pergunta"
                />
              </div>
              {tipoQuiz === "prata" && (
                <div>
                  <Label>URL da Imagem (Opcional)</Label>
                  <Input
                    value={perguntaForm.imagem_url}
                    onChange={(e) => setPerguntaForm({ ...perguntaForm, imagem_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}
              <div>
                <Label>Opções</Label>
                {perguntaForm.opcoes.map((opcao: any, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={opcao.texto}
                      onChange={(e) => updateOpcao(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                    />
                    {perguntaForm.opcoes.length > 2 && (
                      <Button size="sm" variant="outline" onClick={() => removeOpcao(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addOpcao}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                </Button>
              </div>
              <div>
                <Label>Resposta Correta</Label>
                <RadioGroup
                  value={perguntaForm.resposta_correta[0]?.toString()}
                  onValueChange={(v) => setPerguntaForm({ ...perguntaForm, resposta_correta: [parseInt(v)] })}
                >
                  {perguntaForm.opcoes.map((opcao: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={opcao.id.toString()} id={`opcao-${index}`} />
                      <Label htmlFor={`opcao-${index}`}>{opcao.texto || `Opção ${index + 1}`}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button onClick={() => addPerguntaMutation.mutate(perguntaForm)}>
                Adicionar Pergunta
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas ({quizData?.quiz_perguntas?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quizData?.quiz_perguntas?.map((p: any, i: number) => (
                <div key={p.id} className="flex justify-between items-start p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{i + 1}. {p.pergunta}</p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {JSON.parse(p.opcoes || "[]").map((op: any, idx: number) => (
                        <div key={idx} className={op.id === JSON.parse(p.resposta_correta || "[]")[0] ? "font-semibold text-green-600" : ""}>
                          {String.fromCharCode(65 + idx)}) {op.texto}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deletePerguntaMutation.mutate(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};