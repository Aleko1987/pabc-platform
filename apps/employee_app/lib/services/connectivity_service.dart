import 'package:connectivity_plus/connectivity_plus.dart';

/// TODO: Expose as a Riverpod provider; gate writes when offline and queue for sync (Phase 2+).
class ConnectivityService {
  ConnectivityService(this._connectivity);

  final Connectivity _connectivity;

  Stream<List<ConnectivityResult>> get onChanged => _connectivity.onConnectivityChanged;

  Future<bool> get isOnline async {
    final r = await _connectivity.checkConnectivity();
    return !r.contains(ConnectivityResult.none);
  }
}
