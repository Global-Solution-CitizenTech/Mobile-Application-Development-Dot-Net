import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/Input';
import { PickerTriggerButton, SelectPickerModal } from '@/components/SelectPickerModal';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '@/theme';
import { CATEGORIA_CATALOG, getCategoryLabel, getCategoryVisuals } from '@/theme/semanticConfig';
import type { AppTheme } from '@/theme/types';
import type { BoundFieldProps, ChamadoFormData, StringFieldKeys } from '@/types/form';
import { maskCepInput } from '@/utils/formatters';

export interface ChamadoFormFieldsProps {
  field: <K extends StringFieldKeys<ChamadoFormData>>(name: K) => BoundFieldProps;
  hideDetails?: boolean;
  categoriaId?: number;
  onSelectCategoria?: (id: number) => void;
  erroCategoria?: string;
  onUsarGps?: () => void;
  capturandoGps?: boolean;
  erroGps?: string | null;
  localizacaoResumo?: string | null;
}

export const ChamadoFormFields = ({
  field,
  hideDetails = false,
  categoriaId,
  onSelectCategoria,
  erroCategoria,
  onUsarGps,
  capturandoGps,
  erroGps,
  localizacaoResumo,
}: ChamadoFormFieldsProps) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);

  const selectedCat = CATEGORIA_CATALOG.find((c) => c.id === categoriaId);
  const catVisuals = selectedCat ? getCategoryVisuals(selectedCat.nome, theme) : null;
  const categoryLabel = selectedCat ? getCategoryLabel(selectedCat.nome) : 'Selecione uma categoria...';

  const categoryOptions = CATEGORIA_CATALOG.map((cat) => ({
    value: String(cat.id),
    label: getCategoryLabel(cat.nome),
    icon: getCategoryVisuals(cat.nome, theme).iconName,
  }));

  return (
    <View style={styles.container}>
      {!hideDetails && (
        <>
          <Input
            label="Título da Ocorrência *"
            placeholder="Ex: Buraco fundo na faixa direita"
            maxLength={100}
            {...field('titulo')}
          />

          <View style={styles.categoriaWrap}>
            <Text style={styles.categoriaLabel}>Categoria da Ocorrência *</Text>
            <PickerTriggerButton
              icon={catVisuals?.iconName ?? 'grid-outline'}
              label="Categoria"
              valueLabel={categoryLabel}
              active={Boolean(selectedCat)}
              fullWidth
              onPress={() => setModalCategoriaVisible(true)}
            />
            {erroCategoria ? <Text style={styles.categoriaError}>{erroCategoria}</Text> : null}
          </View>

          <SelectPickerModal
            visible={modalCategoriaVisible}
            onClose={() => setModalCategoriaVisible(false)}
            title="Selecione a Categoria"
            subtitle="Identifique o tipo da ocorrência na zeladoria urbana"
            options={categoryOptions}
            selectedValue={categoriaId ? String(categoriaId) : null}
            onSelect={(val) => {
              onSelectCategoria?.(Number(val));
              setModalCategoriaVisible(false);
            }}
          />

          <Input
            label="Descrição Detalhada *"
            placeholder="Descreva o problema, riscos próximos e há quanto tempo ocorre..."
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={styles.textArea}
            {...field('descricao')}
          />
        </>
      )}

      {onUsarGps && (
        <View style={styles.gpsSection}>
          <TouchableOpacity style={styles.gpsButton} onPress={onUsarGps} disabled={capturandoGps} activeOpacity={0.8}>
            {capturandoGps ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="navigate-outline" size={18} color={theme.primary} />
            )}
            <Text style={styles.gpsText}>
              {capturandoGps ? 'Obtendo endereço via GPS...' : 'Preencher Endereço pelo GPS'}
            </Text>
          </TouchableOpacity>
          {localizacaoResumo ? <Text style={styles.gpsSuccess}>{localizacaoResumo}</Text> : null}
          {erroGps ? <Text style={styles.gpsError}>{erroGps}</Text> : null}
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.flexCep}>
          <Input
            label="CEP *"
            placeholder="00000-000"
            keyboardType="number-pad"
            mask={maskCepInput}
            maxLength={9}
            {...field('cep')}
          />
        </View>
        <View style={styles.flexNum}>
          <Input
            label="Número *"
            placeholder="Ex: 1100 ou S/N"
            maxLength={100}
            {...field('numero')}
          />
        </View>
      </View>

      <Input
        label="Rua / Logradouro (Opcional)"
        placeholder="Av. Paulista"
        maxLength={100}
        {...field('rua')}
      />

      <Input
        label="Ponto de Referência *"
        placeholder="Ex: Em frente à entrada do metrô"
        maxLength={50}
        {...field('referencia')}
      />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { gap: spacing.xs },
    categoriaWrap: { gap: spacing.xs, marginBottom: spacing.xs },
    categoriaLabel: { fontSize: fontSize.bodySmall, fontWeight: fontWeight.bold, color: theme.text },
    categoriaError: { fontSize: fontSize.caption, color: theme.danger, fontWeight: fontWeight.medium },
    textArea: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
    gpsSection: { marginBottom: spacing.sm, gap: spacing.xs },
    gpsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 4,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    gpsText: { fontSize: fontSize.bodySmall, fontWeight: fontWeight.bold, color: theme.primary },
    gpsSuccess: { fontSize: fontSize.caption, color: theme.primary, fontWeight: fontWeight.medium },
    gpsError: { fontSize: fontSize.caption, color: theme.danger },
    row: { flexDirection: 'row', gap: spacing.sm },
    flexCep: { flex: 1.2 },
    flexNum: { flex: 1 },
  });
