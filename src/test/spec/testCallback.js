/**
 * This tests the callback functions. See the testUtils script for the data
 */

describe('Testing the functions that handle callbacks', function() {
    'use strict';
    
    it('The phone number should not contain spaces or letters', function() {
        'use strict';
        var firstResult = verifyPhone(testNumber);
        expect(firstResult).to.equal(true);
    });
    
    it('A phone number with letters or spaces should not be allowed', function() {
        'use strict';
        var secondResult = verifyPhone(brokenNumber);
        expect(secondResult).to.equal(false);
    });
    
    it('An earlier date (eg. UTC-0 + 1000) should not be accepted', function() {
       'use strict';
       expect(verifyDate(new Date(), oldDate)).to.equal(false);
    });
    
});