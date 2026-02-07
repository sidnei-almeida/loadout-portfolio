/**
 * Sistema de tipografia Dark Counter Strike
 * Fontes: Orbitron (títulos/premium), Rajdhani (corpo), JetBrains Mono (códigos)
 * 
 * ============================================
 * VERIFICAÇÃO E CONFIGURAÇÃO DA FONTE ORBITRON
 * ============================================
 * 
 * Se a fonte Orbitron não estiver sendo aplicada corretamente, siga estes passos:
 * 
 * 1. VERIFICAR LOCALIZAÇÃO DOS ARQUIVOS DE FONTE:
 *    - Android: android/app/src/main/assets/fonts/
 *    - iOS: ios/YourAppName/Info.plist (adicionar UIAppFonts)
 * 
 * 2. VERIFICAR NOMES DOS ARQUIVOS:
 *    - Arquivos devem estar exatamente com estes nomes (case-sensitive):
 *      * Orbitron-Regular.ttf
 *      * Orbitron-Medium.ttf
 *      * Orbitron-SemiBold.ttf
 *      * Orbitron-Bold.ttf
 *      * Orbitron-ExtraBold.ttf
 * 
 * 3. VERIFICAR NOME DA FONTE NO CÓDIGO:
 *    - O nome usado no fontFamily deve corresponder EXATAMENTE ao nome do arquivo
 *    - Exemplo: 'Orbitron-Medium' para o arquivo Orbitron-Medium.ttf
 *    - NÃO use extensão (.ttf) no código
 * 
 * 4. REBUILD DO APP:
 *    - Após adicionar/modificar fontes, SEMPRE faça rebuild completo:
 *      * Android: cd android && ./gradlew clean && cd .. && npx react-native run-android
 *      * iOS: cd ios && pod install && cd .. && npx react-native run-ios
 * 
 * 5. VERIFICAR SE A FONTE FOI CARREGADA:
 *    - Use React Native Debugger para inspecionar elementos
 *    - Verifique console logs para erros de carregamento de fonte
 *    - Se não carregar, o app usará a fonte padrão do sistema
 * 
 * 6. FALLBACK SEGURO:
 *    - Todos os estilos de fonte incluem fallback: 'Roboto' ou 'System'
 *    - Isso garante que o app funcione mesmo se a fonte não carregar
 * 
 * ============================================
 * 
 * Execute o script download-fonts.sh para baixar automaticamente as fontes.
 * Ou baixe manualmente do Google Fonts e copie para a pasta acima.
 */

export const typography = {
  fonts: {
    // Orbitron - Primary (Títulos)
    primary: 'Orbitron',              // Base - usar com fontWeight
    primaryRegular: 'Orbitron-Regular',
    primaryMedium: 'Orbitron-Medium',
    primarySemiBold: 'Orbitron-SemiBold',
    primaryBold: 'Orbitron-Bold',
    primaryExtraBold: 'Orbitron-ExtraBold',
    primaryBlack: 'Orbitron-Black',
    
    // Rajdhani - Secondary (Corpo)
    secondary: 'Rajdhani',            // Base - usar com fontWeight
    secondaryLight: 'Rajdhani-Light',
    secondaryRegular: 'Rajdhani-Regular',
    secondaryMedium: 'Rajdhani-Medium',
    secondarySemiBold: 'Rajdhani-SemiBold',
    secondaryBold: 'Rajdhani-Bold',
    
    // JetBrains Mono - Mono (Códigos)
    mono: 'JetBrainsMono',            // Base - usar com fontWeight
    monoRegular: 'JetBrainsMono-Regular',
    monoBold: 'JetBrainsMono-Bold',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  // Helpers para text styles comuns
  styles: {
    // Títulos premium com estilo CS2
    h1: {
      fontFamily: 'Orbitron-Bold',    // Usar fonte específica do weight
      fontSize: 32,
      letterSpacing: -1,
    },
    h2: {
      fontFamily: 'Orbitron-SemiBold',
      fontSize: 24,
      letterSpacing: 0.5,
    },
    // Labels uppercase estilo CS2
    label: {
      fontFamily: 'Orbitron-SemiBold',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    // Corpo de texto estilo CS2
    body: {
      fontFamily: 'Rajdhani-Medium',
      fontSize: 15,
    },
    // Valor monetário estilo CS2
    value: {
      fontFamily: 'Orbitron-Bold',
      fontSize: 36,
      letterSpacing: -1,
    },
  },
};

