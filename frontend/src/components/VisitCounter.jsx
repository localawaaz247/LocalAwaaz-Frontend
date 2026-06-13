import React, { useEffect, useState } from 'react';
import Odometer from 'react-odometerjs';
import { Users } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client'; // <-- Added for real-time updates!

// Using your preferred minimal theme
import 'odometer/themes/odometer-theme-minimal.css';

const VisitCounter = () => {
    const [visits, setVisits] = useState(0);

    useEffect(() => {
        // 1. Setup Real-Time Socket Connection
        const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111');

        // Listen for the broadcast from your backend and update state instantly
        socket.on('live_visitor_update', (data) => {
            setVisits(data.count);
        });

        // 2. Initial Data Fetch Logic
        const trackVisit = async () => {
            const hasVisited = localStorage.getItem('localawaaz_visited');

            try {
                if (!hasVisited) {
                    // New visitor: Increment the count
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111'}/api/visits/increment`, // <-- Updated path
                        {},
                        { withCredentials: true }
                    );
                    setVisits(response.data.count);
                    localStorage.setItem('localawaaz_visited', 'true');
                } else {
                    // Returning visitor: Fetch the current count
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:1111'}/api/visits`, // <-- Updated path
                        { withCredentials: true }
                    );
                    // Adding a slight delay makes the odometer roll up on page load
                    setTimeout(() => setVisits(response.data.count), 150);
                }
            } catch (error) {
                console.error("Failed to fetch visit count:", error);
            }
        };

        trackVisit();

        // Cleanup socket connection when component unmounts
        return () => socket.disconnect();
    }, []);

    return (
        <div className="flex items-center gap-3 mt-6 p-3 rounded-xl bg-background/5 border border-background/10 w-fit">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background/10 text-background">
                <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-background/60 uppercase tracking-wider">
                    Total Citizens Reached
                </span>
                <div className="text-xl font-bold text-background font-display tracking-tight">
                    <Odometer value={visits} format="(,ddd)" duration={1000} />
                </div>
            </div>
        </div>
    );
};

export default VisitCounter;