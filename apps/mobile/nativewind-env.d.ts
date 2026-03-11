/// <reference types="nativewind/types" />

// Inline the react-native-css-interop type augmentations for monorepo compatibility.
// NativeWind v4 references react-native-css-interop/types which may not resolve
// correctly when nested inside nativewind's own node_modules.
import type {
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
} from 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface ScrollViewProps
    extends ViewProps,
      ScrollViewPropsIOS,
      ScrollViewPropsAndroid,
      Touchable {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface TextInputProps {
    placeholderClassName?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface KeyboardAvoidingViewProps extends ViewProps {
    contentContainerClassName?: string;
  }
  interface StatusBarProps {
    className?: string;
  }
}

declare module 'react-native-safe-area-context' {
  interface NativeSafeAreaViewProps {
    className?: string;
  }
}
