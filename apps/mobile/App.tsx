import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Note } from '@sirbook/shared';
import { fetchAutocompleteMobile } from './src/services/api';

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-mob-1',
    title: 'Apuntes de Biología Celular',
    content: `Mitocondria: orgánulo celular eucariota responsable de la respiración celular y de generar la mayor parte del ATP celular.

Ciclo de Krebs: ruta metabólica aeróbica central que oxida acetil-CoA en la matriz mitocondrial produciendo NADH, FADH2 y ATP.

Escribe abajo Fotosíntesis y toca la barra flotante arriba del teclado...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'note-mob-2',
    title: 'Algoritmos y Estructuras',
    content: `Recursión: técnica computacional donde una función se llama a sí misma para resolver subproblemas hasta un caso base.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface MobileSuggestion {
  keyword: string;
  completionText: string;
  insertPosition: number;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState<string>(INITIAL_NOTES[0].id);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<MobileSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState<number>(0);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateActiveNote = (fields: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNote.id
          ? { ...n, ...fields, updated_at: new Date().toISOString() }
          : n
      )
    );
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'Nueva Nota',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsDrawerOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      Alert.alert('Aviso', 'Debes mantener al menos una nota.');
      return;
    }
    const nextNotes = notes.filter((n) => n.id !== id);
    setNotes(nextNotes);
    if (activeNoteId === id) {
      setActiveNoteId(nextNotes[0].id);
    }
  };

  // Extraer término candidato antes del cursor
  const extractCandidateKeyword = (text: string, pos: number): string | null => {
    const textBefore = text.slice(0, pos);
    const lastLine = textBefore.split('\n').pop() || '';
    const trimmed = lastLine.trim();

    if (!trimmed || trimmed.length < 3) return null;

    const match = trimmed.match(/(?:^|[#*•\->:,;]|\b)([A-Za-zÀ-ÿ0-9\s_-]{3,35}):?$/);
    if (match && match[1]) {
      const kw = match[1].trim();
      if (kw.length >= 3 && !['que', 'los', 'las', 'por', 'con', 'para', 'una', 'uno'].includes(kw.toLowerCase())) {
        return kw;
      }
    }
    return null;
  };

  const triggerAutocomplete = (text: string, pos: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSuggestion(null);

    debounceTimerRef.current = setTimeout(async () => {
      const kw = extractCandidateKeyword(text, pos);
      if (kw) {
        setIsLoading(true);
        try {
          const res = await fetchAutocompleteMobile(kw, activeNote.title);
          if (res && res.completionText) {
            setSuggestion({
              keyword: kw,
              completionText: res.completionText,
              insertPosition: pos,
            });
          }
        } catch {
          setSuggestion(null);
        } finally {
          setIsLoading(false);
        }
      }
    }, 450);
  };

  const handleContentChange = (val: string) => {
    updateActiveNote({ content: val });
    triggerAutocomplete(val, cursorPos);
  };

  const handleSelectionChange = (e: any) => {
    const pos = e.nativeEvent.selection.start;
    setCursorPos(pos);
  };

  // Aceptar sugerencia desde el chip móvil
  const acceptSuggestion = () => {
    if (!suggestion) return;

    const before = activeNote.content.slice(0, cursorPos);
    const after = activeNote.content.slice(cursorPos);
    const updatedContent = before + suggestion.completionText + after;

    updateActiveNote({ content: updatedContent });
    setSuggestion(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C0E" />

      {/* Header móvil */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={styles.headerButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Sirbook</Text>
          <Text style={styles.headerSubtitle}>Cuaderno Inteligente</Text>
        </View>

        <TouchableOpacity onPress={handleCreateNote} style={styles.newButton}>
          <Text style={styles.newButtonText}>+ Nota</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          {/* Título editable */}
          <TextInput
            style={styles.titleInput}
            value={activeNote.title}
            onChangeText={(title) => updateActiveNote({ title })}
            placeholder="Título del apunte..."
            placeholderTextColor="#52525b"
          />

          {/* Área de escritura */}
          <TextInput
            style={styles.contentInput}
            value={activeNote.content}
            onChangeText={handleContentChange}
            onSelectionChange={handleSelectionChange}
            placeholder="Escribe tus notas aquí... Cuando escribas una palabra clave, aparecerá la sugerencia sobre el teclado."
            placeholderTextColor="#3f3f46"
            multiline
            scrollEnabled={false}
          />
        </ScrollView>

        {/* Barra / Chip flotante sobre el teclado móvil */}
        {suggestion && (
          <View style={styles.suggestionBar}>
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionHeader}>
                ✨ SUGERENCIA PARA "{suggestion.keyword}"
              </Text>
              <Text style={styles.suggestionSnippet} numberOfLines={2}>
                {suggestion.keyword}
                <Text style={styles.suggestionSnippetText}>
                  {suggestion.completionText}
                </Text>
              </Text>
            </View>

            <View style={styles.suggestionActions}>
              <TouchableOpacity
                onPress={acceptSuggestion}
                style={styles.acceptButton}
              >
                <Text style={styles.acceptButtonText}>Insertar ⇥</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSuggestion(null)}
                style={styles.dismissButton}
              >
                <Text style={styles.dismissButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.loadingText}>Buscando concepto...</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Modal / Drawer para lista de notas */}
      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Tus Notas</Text>
              <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                <Text style={styles.closeDrawerText}>Cerrar ✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerList}>
              {notes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.noteItem,
                    item.id === activeNoteId && styles.noteItemActive,
                  ]}
                  onPress={() => {
                    setActiveNoteId(item.id);
                    setIsDrawerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.noteItemTitle,
                        item.id === activeNoteId && styles.noteItemTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title || 'Nota sin título'}
                    </Text>
                    <Text style={styles.noteItemSnippet} numberOfLines={1}>
                      {item.content || 'Nota vacía...'}
                    </Text>
                  </View>

                  {notes.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteNote(item.id)}
                      style={styles.deleteNoteButton}
                    >
                      <Text style={styles.deleteNoteText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleCreateNote}
              style={styles.createNoteDrawerButton}
            >
              <Text style={styles.createNoteDrawerButtonText}>+ Nueva Nota</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0C0E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#111216',
  },
  headerButton: {
    padding: 6,
  },
  menuIcon: {
    color: '#a1a1aa',
    fontSize: 20,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '600',
  },
  newButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  editorScroll: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  titleInput: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  contentInput: {
    color: '#e4e4e7',
    fontSize: 16,
    lineHeight: 26,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  suggestionBar: {
    backgroundColor: '#1a1829',
    borderColor: '#7c3aed',
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 10,
  },
  suggestionHeader: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  suggestionSnippet: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionSnippetText: {
    color: '#d4d4d8',
    fontWeight: '400',
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 8,
  },
  dismissButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  loadingText: {
    color: '#8b5cf6',
    fontSize: 11,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    backgroundColor: '#14151b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeDrawerText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  drawerList: {
    maxHeight: 350,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  noteItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
  },
  noteItemTitle: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '600',
  },
  noteItemTitleActive: {
    color: '#c4b5fd',
  },
  noteItemSnippet: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  deleteNoteButton: {
    padding: 6,
  },
  deleteNoteText: {
    fontSize: 14,
  },
  createNoteDrawerButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  createNoteDrawerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
