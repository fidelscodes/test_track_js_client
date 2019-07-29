import Assignment from './assignment';
import TestTrackConfig from './testTrackConfig';
import Visitor from './visitor';

var Identifier = function(options) {
  this.visitorId = options.visitorId;
  this.identifierType = options.identifierType;
  this.value = options.value;

  if (!this.visitorId) {
    throw new Error('must provide visitorId');
  } else if (!this.identifierType) {
    throw new Error('must provide identifierType');
  } else if (!this.value) {
    throw new Error('must provide value');
  }
};

Identifier.prototype.save = function() {
  return fetch(TestTrackConfig.getUrl() + '/api/v1/identifier', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify({
      identifier_type: this.identifierType,
      value: this.value,
      visitor_id: this.visitorId
    })
  })
    .then(function(response) {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Unexpected status: ' + [response.status, response.body].join(', '));
      }
    })
    .then(function(json) {
      var visitor = new Visitor({
        id: json.visitor.id,
        assignments: Assignment.fromJsonArray(json.visitor.assignments)
      });
      return visitor;
    });
};

export default Identifier;
