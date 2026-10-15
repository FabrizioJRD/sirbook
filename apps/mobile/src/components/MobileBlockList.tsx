import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  Block,
  ConceptBlockContent,
  GraphicBlockContent,
  CuriosityBlockContent,
  FreeBlockContent,
} from '@sirbook/shared';
import { MermaidWebView } from './MermaidWebView';

interface MobileBlockListProps {
  blocks: Block[];
  studyMode: boolean;
  onDeleteBlock?: (id: string) => void;
}

export const MobileBlockList: React.FC<MobileBlockListProps> = ({
  blocks,
  studyMode,
  onDeleteBlock,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (blocks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Sección vacía</Text>
        <Text style={styles.emptySubtitle}>
          Escribe una palabra clave arriba para generar un concepto, gráfico o dato curioso.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {blocks.map((block) => {
        const isRevealed = revealedIds[block.id] || false;
        const isBlurred = studyMode && !isRevealed;

        switch (block.mode) {
          case 'concept': {
            const c = block.content as ConceptBlockContent;
            return (
              <View key={block.id} style={[styles.card, styles.cardConcept]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badgeConcept}>CONCEPTO</Text>
                  {c.contexto && <Text style={styles.contextText}>{c.contexto}</Text>}
                </View>
                <Text style={styles.titleText}>{c.titulo}</Text>

                <TouchableOpacity
                  activeOpacity={isBlurred ? 0.7 : 1}
                  onPress={() => isBlurred && toggleReveal(block.id)}
                  style={isBlurred ? styles.blurBox : null}
                >
                  <Text style={[styles.bodyText, isBlurred ? styles.blurredText : null]}>
                    {c.definicion_corta}
                  </Text>
                  {isBlurred && (
                    <Text style={styles.revealHint}>👁️ Toca para revelar (Modo Estudio)</Text>
                  )}
                </TouchableOpacity>

                {c.puntos_clave && !isBlurred && (
                  <View style={styles.bulletList}>
                    {c.puntos_clave.map((pt, i) => (
                      <Text key={i} style={styles.bulletItem}>
                        • {pt}
                      </Text>
                    ))}
                  </View>
                )}

                {c.fuentes && c.fuentes.length > 0 && (
                  <View style={styles.sourceFooter}>
                    <Text style={styles.sourceLabel}>Fuentes:</Text>
                    {c.fuentes.map((f, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => Linking.openURL(f.url)}
                      >
                        <Text style={styles.sourceLink} numberOfLines={1}>
                          {f.title} ↗
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }

          case 'graphic': {
            const g = block.content as GraphicBlockContent;
            return (
              <View key={block.id} style={[styles.card, styles.cardGraphic]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badgeGraphic}>GRÁFICO</Text>
                  {g.contexto && <Text style={styles.contextText}>{g.contexto}</Text>}
                </View>
                <Text style={styles.titleText}>{g.titulo}</Text>
                <Text style={styles.subtitleText}>{g.descripcion_corta}</Text>

                <MermaidWebView code={g.codigo_render} height={260} />
              </View>
            );
          }

          case 'curiosity': {
            const d = block.content as CuriosityBlockContent;
            return (
              <View key={block.id} style={[styles.card, styles.cardCuriosity]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badgeCuriosity}>DATO O CURIOSIDAD</Text>
                  {d.contexto && <Text style={styles.contextText}>{d.contexto}</Text>}
                </View>
                <Text style={styles.titleText}>{d.titular}</Text>

                {d.cifra_destacada && (
                  <View style={styles.metricBadge}>
                    <Text style={styles.metricText}>{d.cifra_destacada}</Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={isBlurred ? 0.7 : 1}
                  onPress={() => isBlurred && toggleReveal(block.id)}
                  style={isBlurred ? styles.blurBox : null}
                >
                  <Text style={[styles.bodyText, isBlurred ? styles.blurredText : null]}>
                    {d.explicacion}
                  </Text>
                  {isBlurred && (
                    <Text style={styles.revealHint}>👁️ Toca para revelar el dato (Modo Estudio)</Text>
                  )}
                </TouchableOpacity>

                {d.fuente_verificada && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(d.fuente_verificada.url)}
                    style={styles.sourceFooter}
                  >
                    <Text style={styles.sourceLabel}>Fuente Verificada:</Text>
                    <Text style={styles.sourceLink}>{d.fuente_verificada.title} ↗</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          case 'free': {
            const free = block.content as FreeBlockContent;
            return (
              <View key={block.id} style={[styles.card, styles.cardFree]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badgeFree}>NOTA LIBRE</Text>
                </View>
                <Text style={styles.titleText}>{free.titulo || 'Nota Personal'}</Text>
                <Text style={styles.bodyText}>{free.markdown || 'Sin contenido aún.'}</Text>
              </View>
            );
          }

          default:
            return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E4E4E7',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#16181B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardConcept: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardGraphic: {
    borderLeftWidth: 4,
    borderLeftColor: '#A855F7',
  },
  cardCuriosity: {
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
  },
  cardFree: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badgeConcept: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeGraphic: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C084FC',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCuriosity: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE047',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeFree: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contextText: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 12,
    color: '#D4D4D8',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    color: '#D4D4D8',
    lineHeight: 20,
    marginBottom: 8,
  },
  blurBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurredText: {
    color: 'transparent',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  revealHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 4,
  },
  bulletList: {
    marginVertical: 6,
  },
  bulletItem: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 18,
    marginBottom: 4,
  },
  metricBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE047',
  },
  sourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sourceLabel: {
    fontSize: 10,
    color: '#71717A',
  },
  sourceLink: {
    fontSize: 11,
    color: '#818CF8',
    textDecorationLine: 'underline',
  },
});
