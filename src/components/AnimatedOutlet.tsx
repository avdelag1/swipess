import React from 'react';
import { Outlet } from 'react-router-dom';

export function AnimatedOutlet() {
    return (
        <div className="h-full w-full flex flex-col flex-1">
            <Outlet />
        </div>
    );
}
