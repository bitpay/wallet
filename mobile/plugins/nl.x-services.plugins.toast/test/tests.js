cordova.define("nl.x-services.plugins.toast.tests", function(require, exports, module) { exports.defineAutoTests = function() {
  
  var fail = function (done) {
    expect(true).toBe(false);
    done();
  },
  succeed = function (done) {
    expect(true).toBe(true);
    done();
  };

  describe('Plugin availability', function () {
    it("window.plugins.toast should exist", function() {
      expect(window.plugins.toast).toBeDefined();
    });
  });

  describe('API functions', function () {
    it("should define show", function() {
      expect(window.plugins.toast.show).toBeDefined();
    });

    it("should define showShortTop", function() {
      expect(window.plugins.toast.showShortTop).toBeDefined();
    });

    it("should define showShortCenter", function() {
      expect(window.plugins.toast.showShortCenter).toBeDefined();
    });

    it("should define showShortBottom", function() {
      expect(window.plugins.toast.showShortBottom).toBeDefined();
    });

    it("should define showLongTop", function() {
      expect(window.plugins.toast.showLongTop).toBeDefined();
    });

    it("should define showLongCenter", function() {
      expect(window.plugins.toast.showLongCenter).toBeDefined();
    });

    it("should define showLongBottom", function() {
      expect(window.plugins.toast.showLongBottom).toBeDefined();
    });
  });

  describe('Invalid usage', function () {
    it("should fail due to an invalid position", function(done) {
     window.plugins.toast.show('hi', 'short', 'nowhere', fail.bind(null, done), succeed.bind(null, done));
    });

    it("should fail due to an invalid duration", function(done) {
     window.plugins.toast.show('hi', 'medium', 'top', fail.bind(null, done), succeed.bind(null, done));
    });
  });
};

});
