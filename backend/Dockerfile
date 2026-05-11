# Use Node.js 20
FROM node:20-slim

# Install Python3 and ML dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && pip3 install --no-cache-dir --break-system-packages \
    numpy \
    pandas \
    scikit-learn \
    joblib \
    xgboost \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose the port (Gradio/HF default is 7860)
ENV PORT=7860
EXPOSE 7860

# Start the application
CMD ["node", "server.js"]
