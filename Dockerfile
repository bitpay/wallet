FROM dockerfile/nodejs-bower-grunt

MAINTAINER Amit Kumar Jaiswal "amitkumarj441@gmail.com"

RUN apt-get install -y build-essential
RUN mkdir /bitpay/copay
WORKDIR /bitpay/copay
RUN \
    curl -s -L https://github.com/justcoin/copay/tarball/master | tar zx -C /opt/copay/ --strip-components=1 && \
    npm install && \
    bower install --production --force --allow-root --config.interactive=false && \
    grunt
    
# Internal Port expose

EXPOSE 80
CMD PORT=80 npm start
