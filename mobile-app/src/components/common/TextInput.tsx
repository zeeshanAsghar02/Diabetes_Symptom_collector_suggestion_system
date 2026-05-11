/**
 * Modern TextInput Component
 * Production-grade with proper states, accessibility, and clean design
 */

import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing, borderRadius, layout } from '@theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TextInputProps extends Omit<RNTextInputProps, 'placeholderTextColor'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightIconPress?: () => void;
  password?: boolean;
  disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  password = false,
  disabled = false,
  style,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const showHelper = helperText && !hasError;

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, hasError && styles.labelError]}>
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon}
            size={20}
            color={hasError ? colors.error.main : colors.neutral[400]}
            style={styles.leftIcon}
          />
        )}

        {/* Input */}
        <RNTextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || password) && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={password && !isPasswordVisible}
          value={value}
          {...props}
        />

        {/* Password Toggle */}
        {password && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {!password && rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            <MaterialCommunityIcons
              name={rightIcon}
              size={20}
              color={colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Helper Text */}
      {showHelper && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing[2],
  },

  // Label
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  labelError: {
    color: colors.error.main,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.background.primary,
    borderWidth: 1.5,
    borderColor: colors.light.border.main,
    borderRadius: borderRadius.lg,
    minHeight: layout.touchTarget.comfortable,
    paddingHorizontal: spacing[4],
  },
  inputContainerFocused: {
    borderColor: colors.primary[600],
    backgroundColor: colors.light.background.primary,
  },
  inputContainerError: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.bg,
  },
  inputContainerDisabled: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    opacity: 0.6,
  },

  // Input
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.neutral[900],
    paddingVertical: spacing[3],
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  inputWithRightIcon: {
    marginRight: spacing[2],
  },

  // Icons
  leftIcon: {
    marginRight: spacing[1],
  },
  rightIcon: {
    padding: spacing[1],
  },

  // Messages
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error.text,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});

export default TextInput;
