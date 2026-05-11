/**
 * Custom Message Bubble for Gifted Chat
 */

import React from 'react';
import { Bubble, BubbleProps } from 'react-native-gifted-chat';
import { colors } from '@theme/colors';
import { textStyles } from '@theme/typography';

export function MessageBubble(props: BubbleProps<any>) {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: colors.light.background.secondary,
          borderWidth: 1,
          borderColor: colors.light.border.main,
        },
        right: {
          backgroundColor: colors.primary[600],
        },
      }}
      textStyle={{
        left: {
          ...textStyles.body1,
          color: colors.light.text.primary,
        },
        right: {
          ...textStyles.body1,
          color: colors.light.text.inverse,
        },
      }}
      timeTextStyle={{
        left: {
          color: colors.light.text.secondary,
        },
        right: {
          color: colors.light.text.inverse,
        },
      }}
    />
  );
}
