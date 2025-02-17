/**
 * Copyright (c) 2017-2022 Paul-Louis Ageneau
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
	var WebRTC = {
		$WEBRTC: {
			peerConnectionsMap: {},
			dataChannelsMap: {},
			nextId: 1,

			allocUTF8FromString: function(str) {
				var strLen = lengthBytesUTF8(str);
				var strOnHeap = _malloc(strLen+1);
				stringToUTF8(str, strOnHeap, strLen+1);
				return strOnHeap;
			},

			registerPeerConnection: function(peerConnection) {
				var pc = WEBRTC.nextId++;
				WEBRTC.peerConnectionsMap[pc] = peerConnection;
				peerConnection.onnegotiationneeded = function() {
					peerConnection.createOffer()
						.then(function(offer) {
							return WEBRTC.handleDescription(peerConnection, offer);
						})
						.catch(function(err) {
							console.error(err);
						});
				};
				peerConnection.onicecandidate = function(evt) {
					if(evt.candidate && evt.candidate.candidate)
					  WEBRTC.handleCandidate(peerConnection, evt.candidate);
				};
				peerConnection.onconnectionstatechange = function() {
					WEBRTC.handleConnectionStateChange(peerConnection, peerConnection.connectionState)
				};
				peerConnection.oniceconnectionstatechange = function() {
					WEBRTC.handleIceStateChange(peerConnection, peerConnection.iceConnectionState)
				};
				peerConnection.onicegatheringstatechange = function() {
					WEBRTC.handleGatheringStateChange(peerConnection, peerConnection.iceGatheringState)
				};
				peerConnection.onsignalingstatechange = function() {
					WEBRTC.handleSignalingStateChange(peerConnection, peerConnection.signalingState)
				};
				return pc;
			},

			registerDataChannel: function(dataChannel) {
				var dc = WEBRTC.nextId++;
				WEBRTC.dataChannelsMap[dc] = dataChannel;
				dataChannel.binaryType = 'arraybuffer';
				return dc;
			},

			handleDescription: function(peerConnection, description) {
				return peerConnection.setLocalDescription(description)
					.then(function() {
						if(peerConnection.rtcUserDeleted) return;
						if(!peerConnection.rtcDescriptionCallback) return;
						var desc = peerConnection.localDescription;
						var pSdp = WEBRTC.allocUTF8FromString(desc.sdp);
						var pType = WEBRTC.allocUTF8FromString(desc.type);
						var callback =  peerConnection.rtcDescriptionCallback;
						var userPointer = peerConnection.rtcUserPointer || 0;
						{{{ makeDynCall('vppp', 'callback') }}} (pSdp, pType, userPointer);
						_free(pSdp);
						_free(pType);
					});
			},

			handleCandidate: function(peerConnection, candidate) {
				if(peerConnection.rtcUserDeleted) return;
				if(!peerConnection.rtcCandidateCallback) return;
				var pCandidate = WEBRTC.allocUTF8FromString(candidate.candidate);
				var pSdpMid = WEBRTC.allocUTF8FromString(candidate.sdpMid);
				var candidateCallback =  peerConnection.rtcCandidateCallback;
				var userPointer = peerConnection.rtcUserPointer || 0;
				{{{ makeDynCall('vppp', 'candidateCallback') }}} (pCandidate, pSdpMid, userPointer);
				_free(pCandidate);
				_free(pSdpMid);
			},

			handleConnectionStateChange: function(peerConnection, connectionState) {
				if(peerConnection.rtcUserDeleted) return;
				if(!peerConnection.rtcStateChangeCallback) return;
				var map = {
					'new': 0,
					'connecting': 1,
					'connected': 2,
					'disconnected': 3,
					'failed': 4,
					'closed': 5,
				};
				if(connectionState in map) {
					var stateChangeCallback = peerConnection.rtcStateChangeCallback;
					var userPointer = peerConnection.rtcUserPointer || 0;
					{{{ makeDynCall('vip', 'stateChangeCallback') }}} (map[connectionState], userPointer);
				}
			},

      handleIceStateChange: function(peerConnection, iceConnectionState) {
				if(peerConnection.rtcUserDeleted) return;
				if(!peerConnection.rtcIceStateChangeCallback) return;
				var map = {
					'new': 0,
					'checking': 1,
					'connected': 2,
					'completed': 3,
					'failed': 4,
					'disconnected': 5,
					'closed': 6,
				};
				if(iceConnectionState in map) {
					var iceStateChangeCallback = peerConnection.rtcIceStateChangeCallback;
					var userPointer = peerConnection.rtcUserPointer || 0;
					{{{ makeDynCall('vip', 'iceStateChangeCallback') }}} (map[iceConnectionState], userPointer);
				}
			},

			handleGatheringStateChange: function(peerConnection, iceGatheringState) {
				if(peerConnection.rtcUserDeleted) return;
				if(!peerConnection.rtcGatheringStateChangeCallback) return;
				var map = {
					'new': 0,
					'gathering': 1,
					'complete': 2,
				};
				if(iceGatheringState in map) {
					var gatheringStateChangeCallback = peerConnection.rtcGatheringStateChangeCallback;
					var userPointer = peerConnection.rtcUserPointer || 0;
					{{{ makeDynCall('vip', 'gatheringStateChangeCallback') }}} (map[iceGatheringState], userPointer);
				}
			},

			handleSignalingStateChange: function(peerConnection, signalingState) {
				if(peerConnection.rtcUserDeleted) return;
				if(!peerConnection.rtcSignalingStateChangeCallback) return;
				var map = {
					'stable': 0,
					'have-local-offer': 1,
					'have-remote-offer': 2,
					'have-local-pranswer': 3,
					'have-remote-pranswer': 4,
				};
				if(signalingState in map) {
					var signalingStateChangeCallback = peerConnection.rtcSignalingStateChangeCallback;
					var userPointer = peerConnection.rtcUserPointer || 0;
					{{{ makeDynCall('vip', 'signalingStateChangeCallback') }}} (map[signalingState], userPointer);
				}
			},
		},
		rtcCreatePeerConnection__sig: 'ipppi',
		rtcCreatePeerConnection: function(pUrls, pUsernames, pPasswords, nIceServers) {
			if(!window.RTCPeerConnection) return 0;
			var iceServers = [];
			for(var i = 0; i < nIceServers; ++i) {
				var heap = Module['HEAPU32'];
				var pUrl = heap[pUrls/heap.BYTES_PER_ELEMENT + i];
				var url = UTF8ToString(pUrl);
				var pUsername = heap[pUsernames/heap.BYTES_PER_ELEMENT + i];
				var username = UTF8ToString(pUsername);
				var pPassword = heap[pPasswords/heap.BYTES_PER_ELEMENT + i];
				var password = UTF8ToString(pPassword);
				if (username == "") {
					iceServers.push({
						urls: [url],
					});
				} else {
					iceServers.push({
						urls: [url],
						username: username,
						credential: password
					});
				}
			}
			var config = {
				iceServers: iceServers,
			};
			return WEBRTC.registerPeerConnection(new RTCPeerConnection(config));
		},
		rtcDeletePeerConnection__sig: 'vi',
		rtcDeletePeerConnection: function(pc) {
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			if(peerConnection) {
				peerConnection.close();
				peerConnection.rtcUserDeleted = true;
				delete WEBRTC.peerConnectionsMap[pc];
			}
		},
		rtcGetLocalDescription__sig: 'pi',
		rtcGetLocalDescription: function(pc) {
			if(!pc) return 0;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			var localDescription = peerConnection.localDescription;
			if(!localDescription) return 0;
			var sdp = WEBRTC.allocUTF8FromString(localDescription.sdp);
			// sdp should be freed later in c++.
			return sdp;
		},
		rtcGetLocalDescriptionType__sig: 'pi',
		rtcGetLocalDescriptionType: function(pc) {
			if(!pc) return 0;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			var localDescription = peerConnection.localDescription;
			if(!localDescription) return 0;
			var type = WEBRTC.allocUTF8FromString(localDescription.type);
			// type should be freed later in c++.
			return type;
		},
		rtcGetRemoteDescription__sig: 'pi',
    rtcGetRemoteDescription: function(pc) {
			if(!pc) return 0;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			var remoteDescription = peerConnection.remoteDescription;
			if(!remoteDescription) return 0;
			var sdp = WEBRTC.allocUTF8FromString(remoteDescription.sdp);
			// sdp should be freed later in c++.
			return sdp;
		},
		rtcGetRemoteDescriptionType__sig: 'pi',
		rtcGetRemoteDescriptionType: function(pc) {
			if(!pc) return 0;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			var remoteDescription = peerConnection.remoteDescription;
			if(!remoteDescription) return 0;
			var type = WEBRTC.allocUTF8FromString(remoteDescription.type);
			// type should be freed later in c++.
			return type;
		},
		rtcCreateDataChannel__sig: 'iipii',
		rtcCreateDataChannel: function(pc, pLabel, unordered, maxRetransmits, maxPacketLifeTime) {
			if(!pc) return 0;
			var label = UTF8ToString(pLabel);
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			var datachannelInit = {
				ordered: !unordered,
			};

			// Browsers throw an exception when both are present (even if set to null)
			if (maxRetransmits >= 0) datachannelInit.maxRetransmits = maxRetransmits;
			else if (maxPacketLifeTime >= 0) datachannelInit.maxPacketLifeTime = maxPacketLifeTime;

			var channel = peerConnection.createDataChannel(label, datachannelInit);
			return WEBRTC.registerDataChannel(channel);
		},
		rtcDeleteDataChannel__sig: 'vi',
 		rtcDeleteDataChannel: function(dc) {
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			if(dataChannel) {
				dataChannel.rtcUserDeleted = true;
				delete WEBRTC.dataChannelsMap[dc];
			}
		},
		rtcSetDataChannelCallback__sig: 'vip',
		rtcSetDataChannelCallback: function(pc, dataChannelCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.ondatachannel = function(evt) {
				if(peerConnection.rtcUserDeleted) return;
				var dc = WEBRTC.registerDataChannel(evt.channel);
				var userPointer = peerConnection.rtcUserPointer || 0;
				{{{ makeDynCall('vip', 'dataChannelCallback') }}} (dc, userPointer);
			};
		},
		rtcSetLocalDescriptionCallback__sig: 'vip',
		rtcSetLocalDescriptionCallback: function(pc, descriptionCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcDescriptionCallback = descriptionCallback;
		},
		rtcSetLocalCandidateCallback__sig: 'vip',
		rtcSetLocalCandidateCallback: function(pc, candidateCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcCandidateCallback = candidateCallback;
		},
		rtcSetStateChangeCallback__sig: 'vip',
		rtcSetStateChangeCallback: function(pc, stateChangeCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcStateChangeCallback = stateChangeCallback;
		},
		rtcSetIceStateChangeCallback__sig: 'vip',
		rtcSetIceStateChangeCallback: function(pc, iceStateChangeCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcIceStateChangeCallback = iceStateChangeCallback;
		},
		rtcSetGatheringStateChangeCallback__sig: 'vip',
		rtcSetGatheringStateChangeCallback: function(pc, gatheringStateChangeCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcGatheringStateChangeCallback = gatheringStateChangeCallback;
		},
		rtcSetSignalingStateChangeCallback__sig: 'vip',
		rtcSetSignalingStateChangeCallback: function(pc, signalingStateChangeCallback) {
			if(!pc) return;
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.rtcSignalingStateChangeCallback = signalingStateChangeCallback;
		},
		rtcSetRemoteDescription__sig: 'vipp',
		rtcSetRemoteDescription: function(pc, pSdp, pType) {
			var description = new RTCSessionDescription({
				sdp: UTF8ToString(pSdp),
				type: UTF8ToString(pType),
			});
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.setRemoteDescription(description)
				.then(function() {
					if(peerConnection.rtcUserDeleted) return;
					if(description.type == 'offer') {
						peerConnection.createAnswer()
							.then(function(answer) {
								return WEBRTC.handleDescription(peerConnection, answer);
							})
							.catch(function(err) {
								console.error(err);
							});
					}
				})
				.catch(function(err) {
					console.error(err);
				});
		},
		rtcAddRemoteCandidate__sig: 'vipp',
		rtcAddRemoteCandidate: function(pc, pCandidate, pSdpMid) {
			var iceCandidate = new RTCIceCandidate({
				candidate: UTF8ToString(pCandidate),
				sdpMid: UTF8ToString(pSdpMid),
			});
			var peerConnection = WEBRTC.peerConnectionsMap[pc];
			peerConnection.addIceCandidate(iceCandidate)
				.catch(function(err) {
					console.error(err);
				});
		},
		rtcGetDataChannelLabel__sig: 'iipi',
		rtcGetDataChannelLabel: function(dc, pBuffer, size) {
			if(!dc) return 0;
			var label = WEBRTC.dataChannelsMap[dc].label;
			stringToUTF8(label, pBuffer, size);
			return lengthBytesUTF8(label);
		},
		rtcGetDataChannelUnordered__sig: 'ii',
		rtcGetDataChannelUnordered: function(dc) {
			if(!dc) return 0;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			return dataChannel.ordered ? 0 : 1;
		},
		rtcGetDataChannelMaxPacketLifeTime__sig: 'ii',
		rtcGetDataChannelMaxPacketLifeTime: function(dc) {
			if(!dc) return -1;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			return dataChannel.maxPacketLifeTime !== null ? dataChannel.maxPacketLifeTime : -1;
		},
		rtcGetDataChannelMaxRetransmits__sig: 'ii',
		rtcGetDataChannelMaxRetransmits: function(dc) {
			if(!dc) return -1;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			return dataChannel.maxRetransmits !== null ? dataChannel.maxRetransmits : -1;
		},
		rtcSetOpenCallback__sig: 'vip',
		rtcSetOpenCallback: function(dc, openCallback) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			var cb = function() {
				if(dataChannel.rtcUserDeleted) return;
				var userPointer = dataChannel.rtcUserPointer || 0;
				{{{ makeDynCall('vp', 'openCallback') }}} (userPointer);
			};
			dataChannel.onopen = cb;
			if(dataChannel.readyState == 'open') setTimeout(cb, 0);
		},
		rtcSetErrorCallback__sig: 'vip',
		rtcSetErrorCallback: function(dc, errorCallback) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			var cb = function(evt) {
				if(dataChannel.rtcUserDeleted) return;
				var userPointer = dataChannel.rtcUserPointer || 0;
				var pError = evt.message ? WEBRTC.allocUTF8FromString(evt.message) : 0;
				{{{ makeDynCall('vpp', 'errorCallback') }}} (pError, userPointer);
				_free(pError);
			};
			dataChannel.onerror = cb;
		},
		rtcSetMessageCallback__sig: 'vip',
		rtcSetMessageCallback: function(dc, messageCallback) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			dataChannel.onmessage = function(evt) {
				if(dataChannel.rtcUserDeleted) return;
				var userPointer = dataChannel.rtcUserPointer || 0;
				if(typeof evt.data == 'string') {
					var pStr = WEBRTC.allocUTF8FromString(evt.data);
					{{{ makeDynCall('vpip', 'messageCallback') }}} (pStr, -1, userPointer);
					_free(pStr);
				} else {
					var byteArray = new Uint8Array(evt.data);
					var size = byteArray.length;
					var pBuffer = _malloc(size);
					var heapBytes = new Uint8Array(Module['HEAPU8'].buffer, pBuffer, size);
					heapBytes.set(byteArray);
					{{{ makeDynCall('vpip', 'messageCallback') }}} (pBuffer, size, userPointer);
					_free(pBuffer);
				}
			};
			dataChannel.onclose = function() {
				if(dataChannel.rtcUserDeleted) return;
				var userPointer = dataChannel.rtcUserPointer || 0;
				{{{ makeDynCall('vpip', 'messageCallback') }}} (0, 0, userPointer);
			};
		},
		rtcSetBufferedAmountLowCallback__sig: 'vip',
		rtcSetBufferedAmountLowCallback: function(dc, bufferedAmountLowCallback) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			var cb = function(evt) {
				if(dataChannel.rtcUserDeleted) return;
				var userPointer = dataChannel.rtcUserPointer || 0;
				{{{ makeDynCall('vp', 'bufferedAmountLowCallback') }}} (userPointer);
			};
			dataChannel.onbufferedamountlow = cb;
		},
		rtcGetBufferedAmount__sig: 'vi',
		rtcGetBufferedAmount: function(dc) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			return dataChannel.bufferedAmount;
		},
		rtcSetBufferedAmountLowThreshold__sig: 'vii',
		rtcSetBufferedAmountLowThreshold: function(dc, threshold) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			dataChannel.bufferedAmountLowThreshold = threshold;
		},
		rtcSendMessage__sig: 'iipi',
		rtcSendMessage: function(dc, pBuffer, size) {
			if(!dc) return;
			var dataChannel = WEBRTC.dataChannelsMap[dc];
			if(dataChannel.readyState != 'open') return -1;
			if(size >= 0) {
				var heapBytes = new Uint8Array(Module['HEAPU8'].buffer, pBuffer, size);
				if(heapBytes.buffer instanceof ArrayBuffer) {
					dataChannel.send(heapBytes);
				} else {
					var byteArray = new Uint8Array(new ArrayBuffer(size));
					byteArray.set(heapBytes);
					dataChannel.send(byteArray);
				}
				return size;
			} else {
				var str = UTF8ToString(pBuffer);
				dataChannel.send(str);
				return lengthBytesUTF8(str);
			}
		},
		rtcSetUserPointer__sig: 'vip',
		rtcSetUserPointer: function(i, ptr) {
			if(WEBRTC.peerConnectionsMap[i]) WEBRTC.peerConnectionsMap[i].rtcUserPointer = ptr;
			if(WEBRTC.dataChannelsMap[i]) WEBRTC.dataChannelsMap[i].rtcUserPointer = ptr;
		},
	};

	autoAddDeps(WebRTC, '$WEBRTC');
	mergeInto(LibraryManager.library, WebRTC);
})();
