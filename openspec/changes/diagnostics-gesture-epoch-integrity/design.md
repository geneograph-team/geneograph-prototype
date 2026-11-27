# Design

D3 can start a fresh drag on a canvas while a wheel burst is waiting for its idle callback. Cancel the superseded trace at replacement. Match wheel ends by their latest native event, and associate native mouse and touch releases before D3 processes them. Programmatic transforms do not acquire a fresh user trace. Associate summary metadata with the epoch configuration captured at Start. The existing native observer drains queued entries at Stop. A late callback cannot change a different recording.
