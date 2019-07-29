import Assignment from './assignment';
import AssignmentNotification from './assignmentNotification';
import TestTrackConfig from './testTrackConfig'; // eslint-disable-line no-unused-vars
import Visitor from './visitor';

jest.mock('./testTrackConfig', () => {
  return {
    getUrl: () => 'http://testtrack.dev'
  };
});

describe('AssignmentNotification', () => {
  let notificationOptions;
  function createNotification() {
    return new AssignmentNotification(notificationOptions);
  }

  let testContext;
  beforeEach(() => {
    testContext = {};
    global.fetch = jest.fn().mockResolvedValue();

    testContext.visitor = new Visitor({
      id: 'visitorId',
      assignments: []
    });

    testContext.analyticsTrackStub = jest.fn().mockResolvedValue(true);
    testContext.visitor.setAnalytics({
      trackAssignment: testContext.analyticsTrackStub
    });
    testContext.visitor.logError = jest.fn();

    testContext.assignment = new Assignment({
      splitName: 'jabba',
      variant: 'cgi',
      context: 'spec',
      isUnsynced: false
    });

    notificationOptions = {
      visitor: testContext.visitor,
      assignment: testContext.assignment
    };

    testContext.notification = createNotification();
  });

  it('requires a visitor', () => {
    expect(function() {
      delete notificationOptions.visitor;
      createNotification();
    }).toThrow('must provide visitor');
  });

  it('requires an assignment', () => {
    expect(function() {
      delete notificationOptions.assignment;
      createNotification();
    }).toThrow('must provide assignment');
  });

  describe('#send()', () => {
    it('tracks an event', () => {
      testContext.notification.send();

      expect(testContext.analyticsTrackStub).toHaveBeenCalledTimes(1);
      expect(testContext.analyticsTrackStub).toHaveBeenCalledWith('visitorId', testContext.assignment);
    });

    it('notifies the test track server with an analytics success', () => {
      testContext.analyticsTrackStub.mockResolvedValue(true);

      return testContext.notification.send().then(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(1, 'http://testtrack.dev/api/v1/assignment_event', {
          method: 'post',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: '{"visitor_id":"visitorId","split_name":"jabba","context":"spec"}'
        });
        expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://testtrack.dev/api/v1/assignment_event', {
          method: 'post',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: '{"visitor_id":"visitorId","split_name":"jabba","context":"spec","mixpanel_result":"success"}'
        });
      });
    });

    it('notifies the test track server with an analytics failure', () => {
      testContext.analyticsTrackStub.mockResolvedValue(false);

      return testContext.notification.send().then(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(1, 'http://testtrack.dev/api/v1/assignment_event', {
          method: 'post',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: '{"visitor_id":"visitorId","split_name":"jabba","context":"spec"}'
        });
        expect(global.fetch).toHaveBeenNthCalledWith(2, 'http://testtrack.dev/api/v1/assignment_event', {
          method: 'post',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: '{"visitor_id":"visitorId","split_name":"jabba","context":"spec","mixpanel_result":"failure"}'
        });
      });
    });

    it('logs an error if the request fails', () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('something went wrong'));

      expect.assertions(2);
      return testContext.notification.send().then(() => {
        expect(testContext.visitor.logError).toHaveBeenCalledTimes(2);
        expect(testContext.visitor.logError).toHaveBeenCalledWith(
          'test_track persistAssignment error: Error: something went wrong'
        );
      });
    });

    it('logs an error if the request returns a non-200', () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, body: 'body' });

      expect.assertions(2);
      return testContext.notification.send().then(() => {
        expect(testContext.visitor.logError).toHaveBeenCalledTimes(2);
        expect(testContext.visitor.logError).toHaveBeenCalledWith(
          'test_track persistAssignment error: Error: Unexpected status: 500, body'
        );
      });
    });
  });
});
