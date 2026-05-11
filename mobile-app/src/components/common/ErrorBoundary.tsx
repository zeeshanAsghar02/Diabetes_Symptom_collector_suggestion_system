import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, errorId: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
    this.setState({ errorId: errorId ?? null });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.subtitle}>We've been notified of the issue and are looking into it.</Text>
          {this.state.errorId && <Text style={styles.errorId}>Error ID: {this.state.errorId}</Text>}
          <Button mode="contained" onPress={() => this.setState({ hasError: false, errorId: null })}>
            Try again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    errorId: {
        fontSize: 12,
        color: 'grey',
        marginBottom: 20,
    }
})

export default ErrorBoundary;
