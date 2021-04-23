interface Window {
  ethereum: {
    selectedAddress: string;
    isConnected(): boolean;
    request<T>(params: {
      method: string;
      params?: Array<string | number>;
    }): Promise<T>;
    on<T>(event: string, listener: (data: T) => void): void;
  };
}
