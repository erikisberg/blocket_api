# Blocket Bevakningar Monitor

A Python script that continuously monitors your Blocket saved searches (bevakningar) for new items and provides real-time notifications.

## 🚀 Features

- **Continuous Monitoring**: Checks your bevakningar at regular intervals
- **New Item Detection**: Automatically detects when new listings appear
- **State Persistence**: Remembers previous states between runs
- **Detailed Logging**: Logs all activity to both console and file
- **Flexible Configuration**: Customizable check intervals and run modes
- **Real-time Notifications**: Shows new listings as they appear

## 📋 Requirements

- Python 3.10+
- `blocket_api` library (already configured with your token)
- Internet connection

## 🎯 Usage

### Basic Monitoring (Continuous)

```bash
# Monitor continuously with 5-minute intervals (default)
python3 monitor_bevakningar.py

# Monitor with custom interval (e.g., every 2 minutes)
python3 monitor_bevakningar.py --interval 120

# Monitor with limited iterations (e.g., run 10 times then stop)
python3 monitor_bevakningar.py --iterations 10
```

### Single Check

```bash
# Run just once and exit
python3 monitor_bevakningar.py --once
```

### Command Line Options

```bash
python3 monitor_bevakningar.py --help

Options:
  --interval, -i    Check interval in seconds (default: 300 = 5 minutes)
  --iterations, -n  Maximum number of checks to run (default: run indefinitely)
  --once, -o        Run just once and exit
```

## 📊 What You'll See

### Console Output
```
🚀 Starting Blocket Bevakningar Monitor...
🔄 Check #1 at 2025-08-23 20:16:38
Found 2 active bevakningar
🆕 New bevakning discovered: Cyklar säljes i Jämtland (ID: 11998349)
🆕 "cykel", Säljes i Jämtland: Found 3 new items! (Total: 160 → 163)
📝 Recent listings from "cykel", Säljes i Jämtland:
   • Vintage cykel - 1500 kr - 83751
   • Mountain bike - 2500 kr - 83752
   • Barncykel - 800 kr - 83753
```

### Summary Display (Every 5 checks)
```
============================================================
📊 BEVAKNINGAR MONITORING SUMMARY
============================================================

🔍 Cyklar säljes i Jämtland
   ID: 11998349
   Current Total: 28
   New Items: 0
   Last Check: 2025-08-23 20:16:38
   New Items Since Start: 0
   Total Items Seen: 28

🔍 "cykel", Säljes i Jämtland
   ID: 11998018
   Current Total: 163
   New Items: 0
   Last Check: 2025-08-23 20:16:38
   New Items Since Start: 3
   Total Items Seen: 163
============================================================
```

## 📁 Generated Files

The script creates these files:

- **`bevakningar_monitor.log`**: Detailed log of all activity
- **`bevakningar_state.json`**: Persistent state tracking between runs

## ⚙️ Configuration

### Check Intervals

- **5 minutes (300s)**: Default, good for most use cases
- **2 minutes (120s)**: More responsive, higher API usage
- **10 minutes (600s)**: Less responsive, lower API usage

### State Persistence

The script automatically:
- Saves state after each check
- Loads previous state on startup
- Tracks new items since monitoring began
- Remembers total items seen

## 🔄 Monitoring Loop

1. **Check all bevakningar** for current counts
2. **Compare with previous state** to detect new items
3. **Log changes** and show notifications
4. **Save current state** to file
5. **Wait for next interval** and repeat

## 🛑 Stopping the Monitor

- **Ctrl+C**: Gracefully stops monitoring and saves state
- **Automatic**: Stops after specified iterations (if using `--iterations`)

## 💡 Pro Tips

1. **Start with `--once`** to test the script first
2. **Use longer intervals** (10+ minutes) for production use
3. **Monitor the log file** for detailed activity history
4. **Check state file** to see historical tracking data

## 🚨 Troubleshooting

### Common Issues

- **Token expired**: Regenerate your Blocket token
- **API errors**: Check internet connection and Blocket availability
- **Permission errors**: Ensure script has write access to current directory

### Log Analysis

Check `bevakningar_monitor.log` for:
- API request/response details
- Error messages and stack traces
- New item detection events
- State changes and updates

## 🔮 Future Enhancements

Potential improvements:
- Email/SMS notifications for new items
- Webhook integration
- Price change tracking
- Filtering by price range or location
- Export to CSV/JSON
- Web dashboard

## 📞 Support

The script uses your existing `blocket_api` configuration, so it should work immediately with your hardcoded token.
