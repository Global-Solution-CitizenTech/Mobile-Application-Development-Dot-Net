import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { ChamadoFormFields } from '@/components/ChamadoFormFields';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Header } from '@/components/Header';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import type { AppTheme } from '@/theme/types';
import { useChamadoForm } from '@/hooks/useChamadoForm';
import type { AppStackParamList } from '@/navigation/types';
import { PhotoEvidencePicker } from '@/screens/NovoChamado/components/PhotoEvidencePicker';
import type { Chamado } from '@/types/chamado';
import { spacing } from '@/theme';
import { getCategoryLabel, getPriorityLabel } from '@/theme/semanticConfig';

type Props = NativeStackScreenProps<AppStackParamList, 'NovoChamado'>;

export const NovoChamadoScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const form = useChamadoForm({ mode: 'create' });
  const [createdChamado, setCreatedChamado] = useState<Chamado | null>(null);

  const localizacaoResumo = form.localizacaoPreview
    ? [form.localizacaoPreview.bairro, form.localizacaoPreview.cidade].filter(Boolean).join(' • ') || 'Localização capturada'
    : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header
        title="Reportar Ocorrência"
        subtitle="Informe os dados e anexe uma foto da ocorrência"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.lg,
            paddingLeft: Math.max(insets.left, spacing.md),
            paddingRight: Math.max(insets.right, spacing.md),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PhotoEvidencePicker
          foto={form.values.foto}
          onChangeFoto={(foto) => form.setFieldValue('foto', foto)}
          error={form.errors.foto}
        />

        <ChamadoFormFields
          hideDetails={false}
          field={form.field}
          categoriaId={form.values.categoriaId}
          onSelectCategoria={(id) => form.setFieldValue('categoriaId', id)}
          erroCategoria={form.errors.categoriaId}
          onUsarGps={() => {
            void form.handleUsarGps();
          }}
          capturandoGps={form.capturandoGps}
          erroGps={form.erroGps}
          localizacaoResumo={localizacaoResumo}
        />

        <View style={styles.submitWrapper}>
          <Button
            title={form.submitting ? 'Enviando...' : 'Enviar Ocorrência'}
            leftIcon={<Ionicons name="send-outline" size={18} color={theme.inverseText} />}
            size="lg"
            loading={form.submitting}
            onPress={() => form.submit((chamado) => setCreatedChamado(chamado))}
          />
        </View>
      </ScrollView>

      <FeedbackModal
        visible={Boolean(createdChamado)}
        type="success"
        title="Chamado Criado com Sucesso!"
        message={
          createdChamado
            ? `Protocolo #${createdChamado.idChamado}\n\n• Categoria: ${getCategoryLabel(createdChamado.categoriaNome)}\n• Gravidade: ${getPriorityLabel(createdChamado.prioridadeNome)}`
            : ''
        }
        confirmText="Ver Chamado"
        cancelText="Meus Chamados"
        onConfirm={() => {
          const targetId = createdChamado?.idChamado;
          setCreatedChamado(null);
          if (targetId) {
            navigation.replace('ChamadoDetails', { id: targetId });
          }
        }}
        onCancel={() => {
          setCreatedChamado(null);
          navigation.popTo('MainTabs', { screen: 'MeusChamadosTab' });
        }}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.md },
    submitWrapper: { marginTop: spacing.xs },
  });
