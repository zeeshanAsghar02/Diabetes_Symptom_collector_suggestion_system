declare module 'react-native-gifted-chat' {
  import * as React from 'react';

  export type IMessage = {
    _id: string | number;
    text: string;
    createdAt: Date | number;
    user: { _id: string | number; name?: string; avatar?: string };
    image?: string;
    [key: string]: any;
  };

  export type BubbleProps<TMessage extends IMessage = IMessage> = {
    currentMessage?: TMessage;
    [key: string]: any;
  };

  export const GiftedChat: React.ComponentType<any>;
  export const Bubble: React.ComponentType<any>;
}
