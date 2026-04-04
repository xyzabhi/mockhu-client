import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../presentation/theme/theme';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
};

/**
 * Six (or N) digit OTP: tap row to focus; hidden TextInput captures numeric input.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
  };

  const cells = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <Pressable
      style={styles.wrapper}
      onPress={() => {
        if (!disabled) inputRef.current?.focus();
      }}
      disabled={disabled}
      accessibilityRole="none"
      accessibilityHint="Opens keyboard to enter verification code"
    >
      <View style={styles.row}>
        {cells.map((char, index) => {
          const hasChar = char !== '';
          const isActive =
            focused &&
            !disabled &&
            index === value.length &&
            value.length < length;
          return (
            <View
              key={index}
              style={[
                styles.cell,
                isActive && styles.cellActive,
                hasChar && styles.cellFilled,
              ]}
            >
              <Text
                style={[styles.char, hasChar ? styles.charFilled : styles.charEmpty]}
              >
                {hasChar ? char : ''}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Verification code"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        importantForAutofill="yes"
      />
    </Pressable>
  );
}

const GAP = 8;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    columnGap: GAP,
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    maxWidth: 52,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: theme.colors.brand,
    borderWidth: 2,
  },
  cellFilled: {
    borderColor: theme.colors.brand,
  },
  char: {
    fontSize: theme.fintSizes.xl,
    textAlign: 'center',
  },
  charEmpty: {
    fontFamily: theme.typography.regular,
    color: theme.colors.textMuted,
  },
  charFilled: {
    fontFamily: theme.typography.semiBold,
    color: theme.colors.textPrimary,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    fontSize: 1,
  },
});
