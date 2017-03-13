'use strict';

suite(tap, 'focusable', t => {
  let targetEL = null;

  beforeEach(done => {
    Polymer.Base.importHref('editor-framework://test/fixtures/behaviors.html', () => {
      targetEL = document.createElement('test-focusable');
      document.body.appendChild(targetEL);
      done();
    });
  });

  afterEach(done => {
    document.body.removeChild(targetEL);
    targetEL = null;
    done();
  });

  it('should focus target when focus event invoked', done => {
    sinon.spy(targetEL, '_onFocus');
    targetEL.setFocus();

    setTimeout(() => {
      assert( targetEL._onFocus.calledOnce );
      expect( targetEL.focused ).to.be.equal(true);

      done();
    }, 10);
  });

  it('should blur target when blur event invoked', done => {
    sinon.spy(targetEL, '_onBlur');
    targetEL.setFocus();
    targetEL.setBlur();

    setTimeout(() => {
      assert( targetEL._onBlur.calledOnce );
      expect( targetEL.focused ).to.be.equal(false);

      done();
    }, 10);
  });

  it('should focus target when $.focus.focus() called', done => {
    sinon.spy(targetEL, '_onFocus');
    targetEL.$.focus.focus();

    setTimeout(() => {
      assert( targetEL._onFocus.calledOnce );
      expect( targetEL.focused ).to.be.equal(true);

      done();
    }, 10);
  });

  it('should focus target when $.focus.blur() called', done => {
    sinon.spy(targetEL, '_onBlur');
    targetEL.$.focus.focus();
    targetEL.$.focus.blur();

    setTimeout(() => {
      assert( targetEL._onBlur.calledOnce );
      expect( targetEL.focused ).to.be.equal(false);

      done();
    }, 10);
  });

  it('should not invoke _onBlur when target already focused', done => {
    sinon.spy(targetEL, '_onBlur');
    targetEL.$.focus.focus();
    targetEL.$.focus.focus();

    setTimeout(() => {
      expect( targetEL._onBlur.callCount ).to.be.equal(0);
      done();
    }, 10);
  });
});
