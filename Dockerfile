FROM javiersantos/android-ci:28.0.3
LABEL maintainer="VanT"

ENV NODE_VERSION=12.6.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

RUN apt install -y sudo
RUN curl -sL firebase.tools | bash

# Download and install Gradle
RUN \
    cd /usr/local && \
    curl -L https://services.gradle.org/distributions/gradle-6.5-bin.zip -o gradle-6.5-bin.zip && \
    unzip gradle-6.5-bin.zip && \
    rm gradle-6.5-bin.zip

# Export some environment variables
ENV GRADLE_HOME=/usr/local/gradle-6.5
ENV PATH=$PATH:$GRADLE_HOME/bin