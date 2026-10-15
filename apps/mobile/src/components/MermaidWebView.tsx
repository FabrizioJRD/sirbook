import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { sanitizeMermaidCode } from '@sirbook/shared';

interface MermaidWebViewProps {
  code: string;
  height?: number;
}

export const MermaidWebView: React.FC<MermaidWebViewProps> = ({
  code,
  height = 240,
}) => {
  const sanitized = sanitizeMermaidCode(code);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
        <style>
          body {
            background-color: #111215;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
            overflow: auto;
          }
          .mermaid {
            width: 100%;
            display: flex;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="mermaid">
          ${sanitized}
        </div>
        <script>
          mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            themeVariables: {
              darkMode: true,
              background: '#111215',
              primaryColor: '#6366F1',
              primaryTextColor: '#FFFFFF',
              primaryBorderColor: '#818CF8',
              lineColor: '#A1A1AA',
              secondaryColor: '#A855F7',
              tertiaryColor: '#27272A'
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111215',
    marginVertical: 8,
  },
  webview: {
    backgroundColor: '#111215',
  },
});
